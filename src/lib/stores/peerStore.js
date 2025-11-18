/**
 * PeerJS WebRTC connection management
 * Handles peer-to-peer connections for multiplayer gameplay
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import Peer from 'peerjs';

// Connection states
export const PEER_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

// Peer store
function createPeerStore() {
  const { subscribe, set, update } = writable({
    peer: null,
    peerId: null,
    connections: new Map(), // Map<sessionId, DataConnection>
    isHost: false,
    hostConnection: null,
    state: PEER_STATES.DISCONNECTED,
    error: null
  });

  return {
    subscribe,

    /**
     * Initialize as host (game creator)
     */
    initHost: () => {
      if (!browser) return null;

      return new Promise((resolve, reject) => {
        // Create peer with PeerJS cloud server
        const peer = new Peer({
          debug: 1 // Show errors only
        });

        peer.on('open', (id) => {
          console.log('Host peer initialized with ID:', id);

          update(state => ({
            ...state,
            peer,
            peerId: id,
            isHost: true,
            state: PEER_STATES.CONNECTED
          }));

          resolve(id);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);

          update(state => ({
            ...state,
            state: PEER_STATES.ERROR,
            error: err.type === 'unavailable-id' ? 'Game ID already in use' : err.message
          }));

          reject(err);
        });

        // Handle incoming connections from players
        peer.on('connection', (conn) => {
          console.log('Incoming connection from:', conn.peer);

          conn.on('open', () => {
            console.log('Connection opened with:', conn.peer);

            // Store connection
            update(state => {
              const newConnections = new Map(state.connections);
              newConnections.set(conn.metadata?.sessionId || conn.peer, conn);
              return {
                ...state,
                connections: newConnections
              };
            });

            // Notify connection established
            conn.send({
              type: 'connected',
              timestamp: Date.now()
            });
          });

          conn.on('data', (data) => {
            // Handle messages from players
            const currentState = get({ subscribe });
            if (currentState.onDataReceived) {
              currentState.onDataReceived(data, conn.metadata?.sessionId);
            }
          });

          conn.on('close', () => {
            console.log('Connection closed with:', conn.peer);
            update(state => {
              const newConnections = new Map(state.connections);
              newConnections.delete(conn.metadata?.sessionId || conn.peer);
              return {
                ...state,
                connections: newConnections
              };
            });
          });

          conn.on('error', (err) => {
            console.error('Connection error:', err);
          });
        });

        peer.on('disconnected', () => {
          console.log('Peer disconnected');
          update(state => ({
            ...state,
            state: PEER_STATES.DISCONNECTED
          }));

          // Try to reconnect
          if (peer && !peer.destroyed) {
            peer.reconnect();
          }
        });
      });
    },

    /**
     * Connect to host as a player
     */
    connectToHost: (hostId, sessionId) => {
      if (!browser) return null;

      return new Promise((resolve, reject) => {
        const peer = new Peer({
          debug: 1
        });

        peer.on('open', (id) => {
          console.log('Player peer initialized with ID:', id);

          // Connect to host
          const conn = peer.connect(hostId, {
            metadata: { sessionId },
            reliable: true
          });

          conn.on('open', () => {
            console.log('Connected to host:', hostId);

            update(state => ({
              ...state,
              peer,
              peerId: id,
              isHost: false,
              hostConnection: conn,
              state: PEER_STATES.CONNECTED
            }));

            resolve(conn);
          });

          conn.on('data', (data) => {
            // Handle messages from host
            const currentState = get({ subscribe });
            if (currentState.onDataReceived) {
              currentState.onDataReceived(data);
            }
          });

          conn.on('close', () => {
            console.log('Disconnected from host');
            update(state => ({
              ...state,
              hostConnection: null,
              state: PEER_STATES.DISCONNECTED
            }));
          });

          conn.on('error', (err) => {
            console.error('Host connection error:', err);
            update(state => ({
              ...state,
              state: PEER_STATES.ERROR,
              error: err.message
            }));
            reject(err);
          });
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);

          let errorMessage = err.message;
          if (err.type === 'peer-unavailable') {
            errorMessage = 'Game not found. Check the game ID.';
          } else if (err.type === 'network') {
            errorMessage = 'Network error. Please check your connection.';
          }

          update(state => ({
            ...state,
            state: PEER_STATES.ERROR,
            error: errorMessage
          }));

          reject(err);
        });

        update(state => ({
          ...state,
          state: PEER_STATES.CONNECTING
        }));
      });
    },

    /**
     * Send data to all connected peers (host only)
     */
    broadcastToAll: (data) => {
      const state = get({ subscribe });

      if (!state.isHost) {
        console.warn('Only host can broadcast to all');
        return;
      }

      state.connections.forEach((conn) => {
        if (conn.open) {
          conn.send(data);
        }
      });
    },

    /**
     * Send data to host (player only)
     */
    sendToHost: (data) => {
      const state = get({ subscribe });

      if (state.isHost) {
        console.warn('Host cannot send to itself');
        return;
      }

      if (state.hostConnection && state.hostConnection.open) {
        state.hostConnection.send(data);
      } else {
        console.error('Not connected to host');
      }
    },

    /**
     * Set data received callback
     */
    onData: (callback) => {
      update(state => ({
        ...state,
        onDataReceived: callback
      }));
    },

    /**
     * Get connection status
     */
    getStatus: () => {
      const state = get({ subscribe });
      return {
        isConnected: state.state === PEER_STATES.CONNECTED,
        isHost: state.isHost,
        peerId: state.peerId,
        connectionCount: state.connections.size,
        error: state.error
      };
    },

    /**
     * Disconnect and cleanup
     */
    disconnect: () => {
      const state = get({ subscribe });

      // Close all connections
      if (state.connections) {
        state.connections.forEach(conn => {
          if (conn.open) {
            conn.close();
          }
        });
      }

      // Close host connection
      if (state.hostConnection && state.hostConnection.open) {
        state.hostConnection.close();
      }

      // Destroy peer
      if (state.peer && !state.peer.destroyed) {
        state.peer.destroy();
      }

      // Reset state
      set({
        peer: null,
        peerId: null,
        connections: new Map(),
        isHost: false,
        hostConnection: null,
        state: PEER_STATES.DISCONNECTED,
        error: null
      });
    }
  };
}

export const peerStore = createPeerStore();

// Derived store for connection count
export const connectionCount = derived(
  peerStore,
  $peerStore => $peerStore.connections.size
);

// Derived store for connected status
export const isConnected = derived(
  peerStore,
  $peerStore => $peerStore.state === PEER_STATES.CONNECTED
);
