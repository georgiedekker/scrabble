/**
 * Real-time state synchronization using BroadcastChannel API
 * Falls back to localStorage events for cross-tab communication
 */

import { browser } from '$app/environment';
import { gameStore } from './stores/gameStore.js';

const BROADCAST_RETRIES = 3;
const RETRY_DELAY = 100; // ms

let broadcastChannel = null;
let storageListener = null;

/**
 * Initialize synchronization
 */
export function initSync(gameToken) {
  if (!browser) return;

  // Try to use BroadcastChannel API (better performance)
  if ('BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(`scrabble_${gameToken}`);

    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'state_update') {
        gameStore.syncState(event.data.state);
      }
    };
  } else {
    // Fallback to localStorage events
    storageListener = (event) => {
      if (event.key === `scrabble_game_${gameToken}` && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          gameStore.syncState(newState);
        } catch (err) {
          console.error('Failed to parse state update:', err);
        }
      }
    };

    window.addEventListener('storage', storageListener);
  }
}

/**
 * Broadcast state update to other clients
 * Sends the message 3 times with small delays to ensure delivery
 */
export async function broadcastUpdate(state) {
  if (!browser) return;

  const message = {
    type: 'state_update',
    state,
    timestamp: Date.now()
  };

  for (let i = 0; i < BROADCAST_RETRIES; i++) {
    if (broadcastChannel) {
      broadcastChannel.postMessage(message);
    } else {
      // For localStorage fallback, the storage event is triggered automatically
      // when we update localStorage in the store
    }

    if (i < BROADCAST_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

/**
 * Clean up synchronization
 */
export function cleanupSync() {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }

  if (storageListener) {
    window.removeEventListener('storage', storageListener);
    storageListener = null;
  }
}

/**
 * Subscribe to game state changes and broadcast them
 */
export function setupStateBroadcast() {
  if (!browser) return;

  let lastUpdate = 0;

  gameStore.subscribe(state => {
    // Only broadcast if this is a new update (prevent infinite loops)
    if (state.lastUpdate > lastUpdate) {
      lastUpdate = state.lastUpdate;
      broadcastUpdate(state);
    }
  });
}
