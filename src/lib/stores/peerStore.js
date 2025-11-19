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
     * @param {string} peerId - Optional peer ID to use (for reconnection)
     */
    initHost: (peerId = null) => {
      if (!browser) return null;

      return new Promise((resolve, reject) => {
        // Create peer with PeerJS cloud server and proper ICE configuration
        const config = {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ],
            iceCandidatePoolSize: 10
          }
        };

        // If peerId is provided, use it for reconnection
        const peer = peerId ? new Peer(peerId, config) : new Peer(config);

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
          console.log('Incoming connection from:', conn.peer, 'Open:', conn.open, 'Metadata:', conn.metadata);
          console.log('Connection._pc on host:', conn.peerConnection);

          // Log peer connection state changes on host side
          if (conn.peerConnection) {
            conn.peerConnection.addEventListener('connectionstatechange', () => {
              console.log('[Host] RTCPeerConnection state:', conn.peerConnection.connectionState);
            });
            conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
              console.log('[Host] ICE connection state:', conn.peerConnection.iceConnectionState);
            });
            console.log('[Host] Initial connection state:', conn.peerConnection.connectionState);
            console.log('[Host] Initial ICE state:', conn.peerConnection.iceConnectionState);
          }

          let handlerCalled = false;
          const handleConnectionOpen = () => {
            if (handlerCalled) {
              console.log('Handler already called for', conn.peer, ', skipping');
              return;
            }
            handlerCalled = true;

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
            console.log('Sending connected message to:', conn.peer);
            try {
              conn.send({
                type: 'connected',
                timestamp: Date.now()
              });
              console.log('Connected message sent successfully');
            } catch (err) {
              console.error('Failed to send connected message:', err);
            }
          };

          // Check if connection is already open (race condition fix)
          if (conn.open) {
            console.log('Connection already open, calling handler immediately');
            handleConnectionOpen();
          } else {
            console.log('Connection not open yet, setting up open handler');
            conn.on('open', () => {
              console.log('Open event fired for:', conn.peer);
              handleConnectionOpen();
            });

            // Add polling as backup (sometimes 'open' event doesn't fire)
            const pollInterval = setInterval(() => {
              if (conn.open) {
                console.log('Connection opened via polling!');
                clearInterval(pollInterval);
                handleConnectionOpen();
              }
            }, 100);

            // Stop polling after 15 seconds
            setTimeout(() => {
              clearInterval(pollInterval);
              if (!conn.open) {
                console.error('Connection never opened after 15 seconds for:', conn.peer);
              }
            }, 15000);
          }

          conn.on('data', (data) => {
            console.log('Received data from:', conn.peer, data);
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
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ],
            iceCandidatePoolSize: 10
          }
        });

        peer.on('open', (id) => {
          console.log('Player peer initialized with ID:', id);
          console.log('Connecting to host:', hostId);

          // Connect to host with explicit serialization
          const conn = peer.connect(hostId, {
            metadata: { sessionId },
            reliable: true,
            serialization: 'json'  // Use JSON instead of binary
          });

          console.log('Connection object created, waiting for open event...');
          console.log('Connection._pc (peer connection):', conn.peerConnection);

          // Log peer connection state changes
          if (conn.peerConnection) {
            conn.peerConnection.addEventListener('connectionstatechange', () => {
              console.log('RTCPeerConnection state:', conn.peerConnection.connectionState);
            });
            conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
              console.log('ICE connection state:', conn.peerConnection.iceConnectionState);
            });
            console.log('Initial connection state:', conn.peerConnection.connectionState);
            console.log('Initial ICE state:', conn.peerConnection.iceConnectionState);
          }

          // Add timeout for connection
          const connectionTimeout = setTimeout(() => {
            if (!conn.open) {
              console.error('Connection timeout - data channel did not open within 10 seconds');
              const timeoutError = new Error('Connection timeout');
              update(state => ({
                ...state,
                state: PEER_STATES.ERROR,
                error: 'Connection timeout. Please check your network and try again.'
              }));
              reject(timeoutError);
            }
          }, 10000);

          let handlerCalled = false;
          const handleConnectionOpen = () => {
            if (handlerCalled) {
              console.log('Handler already called, skipping');
              return;
            }
            handlerCalled = true;

            console.log('Connected to host:', hostId);
            clearTimeout(connectionTimeout);

            update(state => ({
              ...state,
              peer,
              peerId: id,
              isHost: false,
              hostConnection: conn,
              state: PEER_STATES.CONNECTED
            }));

            resolve(conn);
          };

          // Check if connection is already open (race condition fix)
          if (conn.open) {
            console.log('Connection already open!');
            handleConnectionOpen();
          } else {
            console.log('Setting up open event handler...');
            conn.on('open', handleConnectionOpen);

            // Add polling as backup (sometimes 'open' event doesn't fire)
            const pollInterval = setInterval(() => {
              console.log('Polling connection status, open:', conn.open);
              if (conn.open) {
                console.log('Connection opened via polling!');
                clearInterval(pollInterval);
                handleConnectionOpen();
              }
            }, 500);

            // Stop polling after connection timeout
            setTimeout(() => {
              clearInterval(pollInterval);
            }, 10000);
          }

          conn.on('data', (data) => {
            console.log('Received data from host:', data);
            // Handle messages from host
            const currentState = get({ subscribe });
            if (currentState.onDataReceived) {
              currentState.onDataReceived(data);
            }
          });

          conn.on('close', () => {
            console.log('Disconnected from host');
            clearTimeout(connectionTimeout);
            update(state => ({
              ...state,
              hostConnection: null,
              state: PEER_STATES.DISCONNECTED
            }));
          });

          conn.on('error', (err) => {
            console.error('Host connection error:', err);
            clearTimeout(connectionTimeout);
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
