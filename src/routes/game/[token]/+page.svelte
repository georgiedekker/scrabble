<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { gameStore, currentSession, currentPlayer, isMyTurn } from '$lib/stores/gameStore.js';
  import { sendToHost, broadcastUpdate, cleanupSync } from '$lib/sync.js';
  import { peerStore } from '$lib/stores/peerStore.js';
  import { getLanguageConfig } from '$lib/languages.js';
  import { calculateScore, validatePlacement, isFirstMoveCentered } from '$lib/utils.js';
  import Board from '$lib/components/Board.svelte';
  import TileRack from '$lib/components/TileRack.svelte';
  import { RotateCcw, Check, User } from 'lucide-svelte';

  let token = '';
  let selectedTileIndex = -1;
  let temporaryPlacements = [];
  let error = '';
  let isFirstMove = true;
  let draggingTileIndex = -1;

  $: token = $page.params.token;
  $: language = $gameStore.language;
  $: langConfig = getLanguageConfig(language);
  $: players = $gameStore.players;
  $: currentPlayerInGame = players[$gameStore.currentPlayerIndex];
  $: myRack = $currentPlayer?.rack || [];
  $: board = $gameStore.board;

  // Check if it's the first move of the game
  $: {
    isFirstMove = true;
    for (let row of board) {
      for (let cell of row) {
        if (cell.tile) {
          isFirstMove = false;
          break;
        }
      }
      if (!isFirstMove) break;
    }
  }

  $: isHost = $peerStore.isHost;

  onMount(async () => {
    if (!$currentSession.sessionId) {
      goto('/');
      return;
    }

    const loaded = gameStore.loadGame(token);
    if (!loaded) {
      goto('/');
      return;
    }

    if (!$gameStore.gameStarted) {
      goto(`/lobby/${token}`);
      return;
    }

    // Sync is already initialized from lobby
    // Just verify connection
    const status = peerStore.getStatus();
    if (!status.isConnected) {
      console.error('Not connected to peer network');
      goto(`/lobby/${token}`);
    }
  });

  onDestroy(() => {
    // Don't cleanup - may navigate back
  });

  function handleTileSelect(index) {
    if (!$isMyTurn) return;
    selectedTileIndex = selectedTileIndex === index ? -1 : index;
  }

  function handleTileDragStart(index, letter) {
    if (!$isMyTurn) return;
    draggingTileIndex = index;
  }

  function handleCellDrop(row, col, tileData) {
    if (!$isMyTurn) {
      error = "It's not your turn";
      return;
    }

    const cell = board[row][col];

    // If cell is locked or already has a tile, can't place here
    if (cell.locked || cell.tile) {
      return;
    }

    // Check if there's already a temporary placement here
    const existingIndex = temporaryPlacements.findIndex(p => p.row === row && p.col === col);
    if (existingIndex !== -1) {
      return;
    }

    // Place the tile
    const letter = tileData.letter;
    const tile = {
      letter,
      points: langConfig.points[letter] || 0,
      isBlank: letter === '_'
    };

    temporaryPlacements = [...temporaryPlacements, { row, col, tile }];
    console.log('Added tile via drag at', row, col, 'Tile:', tile, 'All placements:', temporaryPlacements);

    // Remove tile from rack
    myRack = myRack.filter((_, i) => i !== tileData.index);
    selectedTileIndex = -1;
    draggingTileIndex = -1;
    error = '';
  }

  function handleCellClick(row, col) {
    if (!$isMyTurn) {
      error = "It's not your turn";
      return;
    }

    const cell = board[row][col];

    // If cell is locked or already has a tile, can't place here
    if (cell.locked || cell.tile) {
      return;
    }

    // Check if there's already a temporary placement here
    const existingIndex = temporaryPlacements.findIndex(p => p.row === row && p.col === col);

    if (existingIndex !== -1) {
      // Remove the placement and return the tile to rack
      const placement = temporaryPlacements[existingIndex];
      myRack = [...myRack, placement.tile.letter];
      temporaryPlacements = temporaryPlacements.filter((_, i) => i !== existingIndex);
      selectedTileIndex = -1;
      return;
    }

    // Place a tile if one is selected
    if (selectedTileIndex !== -1) {
      const letter = myRack[selectedTileIndex];
      const tile = {
        letter,
        points: langConfig.points[letter] || 0,
        isBlank: letter === '_'
      };

      temporaryPlacements = [...temporaryPlacements, { row, col, tile }];
      console.log('Added tile via click at', row, col, 'Tile:', tile, 'All placements:', temporaryPlacements);

      // Remove tile from rack
      myRack = myRack.filter((_, i) => i !== selectedTileIndex);
      selectedTileIndex = -1;
      error = '';
    }
  }

  function handleRecall() {
    // Return all temporary placements back to rack
    const returnedLetters = temporaryPlacements.map(placement => placement.tile.letter);
    myRack = [...myRack, ...returnedLetters];

    temporaryPlacements = [];
    selectedTileIndex = -1;
    error = '';
  }

  function handleEndTurn() {
    if (!$isMyTurn) return;

    if (temporaryPlacements.length === 0) {
      error = 'You must place at least one tile';
      return;
    }

    // Validate placement
    if (!validatePlacement(temporaryPlacements, board)) {
      error = 'Invalid placement: tiles must be in a straight line';
      return;
    }

    // Check first move touches center
    if (isFirstMove && !isFirstMoveCentered(temporaryPlacements)) {
      error = 'First move must touch the center star';
      return;
    }

    // Calculate score
    const score = calculateScore(temporaryPlacements, board, language);

    console.log('=== ENDING TURN ===');
    console.log('Placements to commit:', temporaryPlacements);
    console.log('Score:', score);

    if (isHost) {
      // Host: Update directly and broadcast
      console.log('Host updating board with placements');
      gameStore.updateBoard(temporaryPlacements);
      gameStore.drawTiles($currentSession.sessionId, temporaryPlacements.length);
      gameStore.endTurn($currentSession.sessionId, score);

      const state = gameStore.getCurrentState();
      console.log('Broadcasting state update. Board after update:', state.board.flatMap((row, r) => row.map((cell, c) => cell.tile ? {r, c, tile: cell.tile} : null)).filter(Boolean));
      broadcastUpdate({
        type: 'state_update',
        state,
        timestamp: Date.now()
      });
    } else {
      // Player: Send action to host
      console.log('Player sending action to host');
      sendToHost({
        type: 'action',
        action: {
          type: 'place_tiles',
          placements: temporaryPlacements,
          tilesUsed: temporaryPlacements.length,
          score
        },
        timestamp: Date.now()
      });
    }

    // Reset temporary state
    temporaryPlacements = [];
    selectedTileIndex = -1;
    error = '';
    console.log('=== TURN ENDED ===');
  }

  function handlePass() {
    if (!$isMyTurn) return;

    if (confirm('Are you sure you want to pass your turn?')) {
      handleRecall();

      if (isHost) {
        gameStore.endTurn($currentSession.sessionId, 0);

        const state = gameStore.getCurrentState();
        broadcastUpdate({
          type: 'state_update',
          state,
          timestamp: Date.now()
        });
      } else {
        sendToHost({
          type: 'action',
          action: {
            type: 'pass_turn'
          },
          timestamp: Date.now()
        });
      }
    }
  }
</script>

<svelte:head>
  <title>Scrabble Game - {token}</title>
</svelte:head>

<div class="game-container">
  <!-- Header -->
  <div class="header">
    <h1 class="game-title">Scrabble</h1>
    <div class="game-info">
      <span class="token">Game: {token}</span>
      <span class="language">Lang: {language}</span>
    </div>
  </div>

  <!-- Players Section -->
  <div class="players-bar">
    {#each players as player, index}
      <div
        class="player-info"
        class:active={index === $gameStore.currentPlayerIndex}
        class:current-user={player.sessionId === $currentSession.sessionId}
      >
        <div class="player-header">
          <User class="w-4 h-4" />
          <span class="player-name">{player.name}</span>
        </div>
        <div class="player-score">{player.score} pts</div>
        {#if index === $gameStore.currentPlayerIndex}
          <div class="turn-indicator">Current Turn</div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Error/Status Messages -->
  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if !$isMyTurn}
    <div class="info-message">
      Waiting for {currentPlayerInGame?.name}'s turn...
    </div>
  {/if}

  <!-- Game Board -->
  <div class="board-section">
    <Board
      onCellClick={handleCellClick}
      onCellDrop={handleCellDrop}
      {temporaryPlacements}
    />
  </div>

  <!-- Tile Rack -->
  <div class="rack-section">
    <TileRack
      tiles={myRack}
      {language}
      onTileSelect={handleTileSelect}
      onDragStart={handleTileDragStart}
      selectedIndex={selectedTileIndex}
      disabled={!$isMyTurn}
    />
  </div>

  <!-- Action Buttons -->
  <div class="actions">
    {#if $isMyTurn}
      <button
        class="btn btn-recall"
        on:click={handleRecall}
        disabled={temporaryPlacements.length === 0}
      >
        <RotateCcw class="w-5 h-5" />
        Recall
      </button>

      <button
        class="btn btn-end-turn"
        on:click={handleEndTurn}
        disabled={temporaryPlacements.length === 0}
      >
        <Check class="w-5 h-5" />
        End Turn
      </button>

      <button class="btn btn-pass" on:click={handlePass}>
        Pass
      </button>
    {/if}
  </div>

  <!-- Instructions for mobile -->
  <div class="instructions">
    <p class="instruction-text">
      {#if $isMyTurn}
        {#if selectedTileIndex !== -1}
          Tap a cell on the board to place your tile
        {:else}
          Tap a tile from your rack, then tap a cell on the board
        {/if}
      {:else}
        Wait for your turn
      {/if}
    </p>
  </div>
</div>

<style>
  .game-container {
    @apply bg-gradient-to-br from-blue-50 to-indigo-100;
    @apply flex flex-col;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .header {
    @apply bg-white rounded-lg shadow-lg;
    @apply flex items-center justify-between;
    padding: 0.25rem 0.5rem;
  }

  .game-title {
    @apply text-base md:text-lg font-bold text-indigo-900;
  }

  .game-info {
    @apply flex gap-2 text-xs text-gray-600;
  }

  .token {
    @apply font-mono font-semibold;
  }

  .players-bar {
    @apply bg-white rounded-lg shadow-lg;
    @apply grid grid-cols-2 md:grid-cols-4 gap-1;
    padding: 0.25rem;
  }

  .player-info {
    @apply bg-gray-50 rounded;
    @apply border border-gray-200;
    @apply transition-all duration-200;
    padding: 0.25rem;
  }

  .player-info.active {
    @apply border-green-500 bg-green-50;
  }

  .player-info.current-user {
    @apply ring-2 ring-indigo-400;
  }

  .player-header {
    @apply flex items-center gap-1 mb-1;
  }

  .player-name {
    @apply font-semibold text-gray-800 text-xs;
  }

  .player-score {
    @apply text-sm font-bold text-indigo-600;
  }

  .turn-indicator {
    @apply text-xs text-green-600 font-semibold;
  }

  .error-message {
    @apply bg-red-100 border border-red-400 text-red-700;
    @apply px-3 py-2 rounded-lg text-center font-semibold text-sm;
  }

  .info-message {
    @apply bg-blue-100 border border-blue-400 text-blue-700;
    @apply px-3 py-2 rounded-lg text-center font-semibold text-sm;
  }

  .board-section {
    /* Make board grow to fill available space */
    flex: 1;
    min-height: 0;
    @apply bg-white rounded-lg shadow-lg;
    @apply flex items-center justify-center;
    padding: 0.5rem;
  }

  .rack-section {
    @apply bg-white rounded-lg shadow-lg;
    padding: 0.25rem;
  }

  .actions {
    @apply flex gap-2 justify-center;
    padding: 0.25rem 0;
  }

  .btn {
    @apply px-2 py-1 rounded-lg font-semibold text-xs;
    @apply transition-all duration-200;
    @apply flex items-center gap-1;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-recall {
    @apply bg-yellow-500 text-white hover:bg-yellow-600;
  }

  .btn-end-turn {
    @apply bg-green-600 text-white hover:bg-green-700;
    @apply shadow-lg hover:shadow-xl;
  }

  .btn-pass {
    @apply bg-gray-500 text-white hover:bg-gray-600;
  }

  .instructions {
    @apply bg-indigo-50 rounded text-center;
    padding: 0.25rem;
  }

  .instruction-text {
    @apply text-[10px] text-indigo-800 font-medium;
  }

  @media (max-width: 640px) {
    .game-info {
      @apply flex-col gap-1;
    }

    .btn {
      @apply text-xs px-2 py-1;
    }
  }
</style>
