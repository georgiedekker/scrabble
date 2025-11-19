import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { getLanguageConfig } from '../languages.js';
import { generateToken, generateSessionId } from '../utils.js';

const BOARD_SIZE = 15;

// Special cells on the Scrabble board
const SPECIAL_CELLS = {
  TW: [ // Triple Word
    [0, 0], [0, 7], [0, 14],
    [7, 0], [7, 14],
    [14, 0], [14, 7], [14, 14]
  ],
  DW: [ // Double Word
    [1, 1], [2, 2], [3, 3], [4, 4],
    [1, 13], [2, 12], [3, 11], [4, 10],
    [13, 1], [12, 2], [11, 3], [10, 4],
    [13, 13], [12, 12], [11, 11], [10, 10],
    [7, 7] // Center star
  ],
  TL: [ // Triple Letter
    [1, 5], [1, 9],
    [5, 1], [5, 5], [5, 9], [5, 13],
    [9, 1], [9, 5], [9, 9], [9, 13],
    [13, 5], [13, 9]
  ],
  DL: [ // Double Letter
    [0, 3], [0, 11],
    [2, 6], [2, 8],
    [3, 0], [3, 7], [3, 14],
    [6, 2], [6, 6], [6, 8], [6, 12],
    [7, 3], [7, 11],
    [8, 2], [8, 6], [8, 8], [8, 12],
    [11, 0], [11, 7], [11, 14],
    [12, 6], [12, 8],
    [14, 3], [14, 11]
  ]
};

function createEmptyBoard() {
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      let type = 'normal';

      // Check special cells
      if (SPECIAL_CELLS.TW.some(([r, c]) => r === row && c === col)) type = 'TW';
      else if (SPECIAL_CELLS.DW.some(([r, c]) => r === row && c === col)) type = 'DW';
      else if (SPECIAL_CELLS.TL.some(([r, c]) => r === row && c === col)) type = 'TL';
      else if (SPECIAL_CELLS.DL.some(([r, c]) => r === row && c === col)) type = 'DL';

      board[row][col] = {
        type,
        tile: null, // { letter, points, isBlank }
        locked: false
      };
    }
  }
  return board;
}

function shuffleTiles(tiles) {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createInitialGameState() {
  return {
    gameToken: null,
    language: 'EN',
    board: createEmptyBoard(),
    tileBag: [],
    players: [],
    currentPlayerIndex: 0,
    gameStarted: false,
    gameEnded: false,
    temporaryPlacements: {}, // Map of sessionId -> array of placements
    lastUpdate: Date.now()
  };
}

// Main game state store
function createGameStore() {
  const { subscribe, set, update } = writable(createInitialGameState());

  return {
    subscribe,

    // Initialize a new game
    newGame: (hostName, language = 'EN', gameToken = null) => {
      // Use provided token (e.g., peer ID) or generate a random one
      const token = gameToken || generateToken();
      const langConfig = getLanguageConfig(language);
      const tileBag = shuffleTiles(langConfig.tiles);

      const initialRack = tileBag.splice(0, 7);
      const hostPlayer = {
        sessionId: generateSessionId(),
        name: hostName,
        rack: initialRack,
        score: 0,
        isHost: true
      };

      const state = {
        gameToken: token,
        language,
        board: createEmptyBoard(),
        tileBag,
        players: [hostPlayer],
        currentPlayerIndex: 0,
        gameStarted: false,
        gameEnded: false,
        lastUpdate: Date.now()
      };

      set(state);

      if (browser) {
        localStorage.setItem(`scrabble_game_${token}`, JSON.stringify(state));
      }

      return { gameToken: token, sessionId: hostPlayer.sessionId };
    },

    // Join an existing game
    joinGame: (gameToken, playerName) => {
      if (!browser) return null;

      const savedGame = localStorage.getItem(`scrabble_game_${gameToken}`);
      if (!savedGame) return null;

      const state = JSON.parse(savedGame);

      // Check if game is full (max 4 players)
      if (state.players.length >= 4) return null;

      // Check if game already started
      if (state.gameStarted) return null;

      const langConfig = getLanguageConfig(state.language);
      const initialRack = state.tileBag.splice(0, 7);
      const sessionId = generateSessionId();

      const newPlayer = {
        sessionId,
        name: playerName,
        rack: initialRack,
        score: 0,
        isHost: false
      };

      state.players.push(newPlayer);
      state.lastUpdate = Date.now();

      set(state);
      localStorage.setItem(`scrabble_game_${gameToken}`, JSON.stringify(state));

      return sessionId;
    },

    // Update game token (used when peer ID is assigned)
    updateGameToken: (newToken, sessionId) => {
      update(state => {
        const oldToken = state.gameToken;

        // Update token
        state.gameToken = newToken;
        state.lastUpdate = Date.now();

        if (browser) {
          // Remove old localStorage entry
          if (oldToken) {
            localStorage.removeItem(`scrabble_game_${oldToken}`);
          }

          // Save with new token
          localStorage.setItem(`scrabble_game_${newToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // Start the game
    startGame: () => {
      update(state => {
        state.gameStarted = true;
        state.lastUpdate = Date.now();

        if (browser) {
          localStorage.setItem(`scrabble_game_${state.gameToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // Update board with new tiles
    updateBoard: (placements) => {
      update(state => {
        placements.forEach(({ row, col, tile }) => {
          state.board[row][col].tile = tile;
          state.board[row][col].locked = true;
        });
        state.lastUpdate = Date.now();

        if (browser) {
          localStorage.setItem(`scrabble_game_${state.gameToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // Draw tiles from bag
    drawTiles: (sessionId, count) => {
      update(state => {
        const playerIndex = state.players.findIndex(p => p.sessionId === sessionId);
        if (playerIndex === -1) return state;

        const drawnTiles = state.tileBag.splice(0, Math.min(count, state.tileBag.length));
        state.players[playerIndex].rack.push(...drawnTiles);
        state.lastUpdate = Date.now();

        if (browser) {
          localStorage.setItem(`scrabble_game_${state.gameToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // End turn and move to next player
    endTurn: (sessionId, score) => {
      update(state => {
        const playerIndex = state.players.findIndex(p => p.sessionId === sessionId);
        if (playerIndex === -1) return state;

        state.players[playerIndex].score += score;
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

        // Clear temporary placements for the player who just ended their turn
        if (state.temporaryPlacements[sessionId]) {
          delete state.temporaryPlacements[sessionId];
        }

        state.lastUpdate = Date.now();

        if (browser) {
          localStorage.setItem(`scrabble_game_${state.gameToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // Update temporary placements for a player
    updateTemporaryPlacements: (sessionId, placements) => {
      update(state => {
        state.temporaryPlacements[sessionId] = placements;
        state.lastUpdate = Date.now();

        if (browser) {
          localStorage.setItem(`scrabble_game_${state.gameToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // Load game from localStorage
    loadGame: (gameToken) => {
      if (!browser) return false;

      const savedGame = localStorage.getItem(`scrabble_game_${gameToken}`);
      if (!savedGame) return false;

      set(JSON.parse(savedGame));
      return true;
    },

    // Sync state from external update
    syncState: (newState) => {
      set(newState);

      // Only save to localStorage if we're the host
      if (browser && newState.players && newState.players.length > 0) {
        const hostPlayer = newState.players.find(p => p.isHost);
        if (hostPlayer) {
          localStorage.setItem(`scrabble_game_${newState.gameToken}`, JSON.stringify(newState));
        }
      }
    },

    // Get current state
    getCurrentState: () => {
      return get({ subscribe });
    },

    // Add player (used when player joins via WebRTC)
    addPlayer: (playerName, sessionId) => {
      update(state => {
        // Check if player already exists (prevent duplicates)
        if (state.players.some(p => p.sessionId === sessionId)) {
          console.log('Player already exists with session:', sessionId);
          return state;
        }

        // Check if game is full
        if (state.players.length >= 4) {
          console.warn('Game is full, cannot add more players');
          return state;
        }

        const langConfig = getLanguageConfig(state.language);
        const initialRack = state.tileBag.splice(0, 7);

        const newPlayer = {
          sessionId,
          name: playerName,
          rack: initialRack,
          score: 0,
          isHost: false
        };

        state.players.push(newPlayer);
        state.lastUpdate = Date.now();

        if (browser) {
          localStorage.setItem(`scrabble_game_${state.gameToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // Remove player
    removePlayer: (sessionId) => {
      update(state => {
        state.players = state.players.filter(p => p.sessionId !== sessionId);

        // Adjust current player index if needed
        if (state.currentPlayerIndex >= state.players.length) {
          state.currentPlayerIndex = 0;
        }

        state.lastUpdate = Date.now();

        if (browser) {
          localStorage.setItem(`scrabble_game_${state.gameToken}`, JSON.stringify(state));
        }

        return state;
      });
    },

    // Reset game
    reset: () => {
      set(createInitialGameState());
    }
  };
}

export const gameStore = createGameStore();

// Current session store with localStorage persistence
function createCurrentSessionStore() {
  const STORAGE_KEY = 'scrabble_current_session';

  // Load from localStorage on initialization
  const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
  const initial = stored ? JSON.parse(stored) : {
    sessionId: null,
    playerName: null,
    gameToken: null
  };

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set: (value) => {
      if (browser) {
        if (value.sessionId) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      set(value);
    },
    update: (fn) => {
      update(state => {
        const newState = fn(state);
        if (browser) {
          if (newState.sessionId) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        return newState;
      });
    },
    clear: () => {
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
      }
      set({
        sessionId: null,
        playerName: null,
        gameToken: null
      });
    }
  };
}

export const currentSession = createCurrentSessionStore();

// Derived store for current player
export const currentPlayer = derived(
  [gameStore, currentSession],
  ([$gameStore, $currentSession]) => {
    if (!$currentSession.sessionId) return null;
    return $gameStore.players.find(p => p.sessionId === $currentSession.sessionId);
  }
);

// Derived store for whether it's current player's turn
export const isMyTurn = derived(
  [gameStore, currentSession],
  ([$gameStore, $currentSession]) => {
    if (!$currentSession.sessionId || !$gameStore.gameStarted) return false;
    const currentPlayer = $gameStore.players[$gameStore.currentPlayerIndex];
    return currentPlayer?.sessionId === $currentSession.sessionId;
  }
);
