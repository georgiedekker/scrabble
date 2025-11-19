/**
 * Real-time state synchronization using PeerJS WebRTC
 * Enables true cross-device multiplayer
 */

import { browser } from '$app/environment';
import { peerStore } from './stores/peerStore.js';
import { gameStore } from './stores/gameStore.js';

let isInitialized = false;

/**
 * Initialize synchronization for host
 */
export async function initSyncAsHost() {
  if (!browser) return null;

  // If already initialized, return existing peer ID
  if (isInitialized) {
    const status = peerStore.getStatus();
    return status.peerId;
  }

  try {
    // Initialize as host
    const peerId = await peerStore.initHost();

    // Set up data handler
    peerStore.onData((data, senderSessionId) => {
      console.log('Host received data:', data, 'from:', senderSessionId);

      if (data.type === 'action') {
        // Handle player actions
        handlePlayerAction(data.action, senderSessionId);
      } else if (data.type === 'request_state') {
        // Send full state to player
        const state = gameStore.getCurrentState();
        broadcastUpdate({
          type: 'full_state',
          state,
          timestamp: Date.now()
        });
      }
    });

    isInitialized = true;
    return peerId;
  } catch (error) {
    console.error('Failed to initialize host sync:', error);
    throw error;
  }
}

/**
 * Initialize synchronization for player
 */
export async function initSyncAsPlayer(hostId, sessionId) {
  if (!browser || isInitialized) return;

  try {
    // Connect to host
    await peerStore.connectToHost(hostId, sessionId);

    // Set up data handler
    peerStore.onData((data) => {
      console.log('Player received data:', data);

      if (data.type === 'state_update' || data.type === 'full_state') {
        // Update local game state
        gameStore.syncState(data.state);
      } else if (data.type === 'connected') {
        // Request full state after connection
        sendToHost({
          type: 'request_state',
          timestamp: Date.now()
        });
      }
    });

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize player sync:', error);
    throw error;
  }
}

/**
 * Broadcast state update to all players (host only)
 */
export function broadcastUpdate(message) {
  if (!browser) return;

  const status = peerStore.getStatus();

  if (!status.isHost) {
    console.warn('Only host can broadcast updates');
    return;
  }

  // Send to all connected peers 3 times for reliability
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      peerStore.broadcastToAll(message);
    }, i * 50); // 50ms delay between retries
  }
}

/**
 * Send data to host (player only)
 */
export function sendToHost(message) {
  if (!browser) return;

  const status = peerStore.getStatus();

  if (status.isHost) {
    console.warn('Host cannot send to itself');
    return;
  }

  // Send 3 times for reliability
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      peerStore.sendToHost(message);
    }, i * 50);
  }
}

/**
 * Handle player action (host only)
 */
function handlePlayerAction(action, sessionId) {
  console.log('Handling action from', sessionId, ':', action);

  switch (action.type) {
    case 'place_tiles':
      gameStore.updateBoard(action.placements);
      gameStore.drawTiles(sessionId, action.tilesUsed);
      gameStore.endTurn(sessionId, action.score);
      break;

    case 'pass_turn':
      gameStore.endTurn(sessionId, 0);
      break;

    case 'update_rack':
      // Handle rack updates if needed
      break;

    default:
      console.warn('Unknown action type:', action.type);
  }

  // Broadcast updated state to all players
  const state = gameStore.getCurrentState();
  broadcastUpdate({
    type: 'state_update',
    state,
    timestamp: Date.now()
  });
}

/**
 * Clean up synchronization
 */
export function cleanupSync() {
  if (!browser) return;

  peerStore.disconnect();
  isInitialized = false;
}

/**
 * Get connection status
 */
export function getSyncStatus() {
  return peerStore.getStatus();
}
