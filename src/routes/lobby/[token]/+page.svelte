<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { gameStore, currentSession } from '$lib/stores/gameStore.js';
  import { peerStore, connectionCount } from '$lib/stores/peerStore.js';
  import { initSyncAsHost, initSyncAsPlayer, broadcastUpdate, cleanupSync } from '$lib/sync.js';
  import { copyToClipboard } from '$lib/utils.js';
  import { Copy, Users, Play, Loader, Wifi, WifiOff } from 'lucide-svelte';

  let token = '';
  let showCopied = false;
  let shareUrl = '';
  let shareLabel = 'Copy Share Link';
  let connectionError = '';
  let isInitializing = true;

  $: token = $page.params.token;
  $: players = $gameStore.players;
  $: gameStarted = $gameStore.gameStarted;
  $: language = $gameStore.language;
  $: isHost = players.find(p => p.sessionId === $currentSession.sessionId)?.isHost || false;
  $: connectedPeers = $connectionCount;
  $: peerStatus = $peerStore.state;

  onMount(async () => {
    if (!$currentSession.sessionId) {
      // Not logged in, redirect home
      goto('/');
      return;
    }

    try {
      isInitializing = true;

      // Load game state from localStorage
      const gameLoaded = gameStore.loadGame(token);
      console.log('Game loaded from localStorage:', gameLoaded);

      if (isHost) {
        // Host: Peer should already be initialized from home page
        // Just verify and set up handlers
        console.log('Setting up lobby as host...');

        const status = peerStore.getStatus();

        if (!status.isConnected) {
          // If somehow not connected (e.g., page refresh), reinitialize with same ID
          console.log('Peer not initialized, initializing with token:', token);
          await initSyncAsHost(token);
        } else {
          console.log('Peer already connected, ID:', status.peerId);
        }
        // Note: Data handlers are set up in sync.js (initSyncAsHost)
      } else {
        // Player: Connect to host
        if (!gameLoaded) {
          // No local game, will receive state from host after connecting
          console.log('No local game found, will receive state from host...');
        }

        await initSyncAsPlayer(token, $currentSession.sessionId);
        console.log('Connected to host');

        // Request current state immediately to check if game has started
        setTimeout(() => {
          peerStore.sendToHost({
            type: 'request_state',
            timestamp: Date.now()
          });
        }, 100);

        // Request to join game (send once, not with retry)
        setTimeout(() => {
          const message = {
            type: 'join_request',
            playerName: $currentSession.playerName,
            sessionId: $currentSession.sessionId,
            timestamp: Date.now()
          };

          // Send directly via peerStore (only once)
          peerStore.sendToHost(message);
        }, 500);
      }

      isInitializing = false;

      // Set share URL
      if (typeof window !== 'undefined') {
        shareUrl = `${window.location.origin}/?join=${token}`;
      }
    } catch (error) {
      console.error('Lobby initialization error:', error);
      connectionError = error.message || 'Failed to connect';
      isInitializing = false;
    }
  });

  onDestroy(() => {
    // Don't cleanup if we're navigating to game
    if (!gameStarted) {
      cleanupSync();
    }
  });

  function showCopiedMessage(label = 'Copied to clipboard!') {
    shareLabel = label;
    showCopied = true;
    setTimeout(() => {
      showCopied = false;
      shareLabel = 'Copy Share Link';
    }, 2000);
  }

  async function handleCopyToken() {
    const success = await copyToClipboard(token);
    if (success) {
      showCopiedMessage('Game ID copied!');
    }
  }

  async function handleCopyLink() {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      showCopiedMessage('Invite link copied!');
    }
  }

  function handleStartGame() {
    if (!isHost) return;
    if (players.length < 2) {
      alert('Need at least 2 players to start');
      return;
    }

    gameStore.startGame();

    // Broadcast game start
    const state = gameStore.getCurrentState();
    broadcastUpdate({
      type: 'game_start',
      state,
      timestamp: Date.now()
    });

    goto(`/game/${token}`);
  }

  // Auto-navigate when game starts
  $: if (gameStarted && !isHost && typeof window !== 'undefined') {
    goto(`/game/${token}`);
  }
</script>

<svelte:head>
  <title>Game Lobby - {token}</title>
</svelte:head>

<div class="container">
  <div class="content">
    <h1 class="title">Game Lobby</h1>

    {#if isInitializing}
      <div class="loading-box">
        <Loader class="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
        <p class="text-lg">
          {isHost ? 'Setting up game...' : 'Connecting to host...'}
        </p>
      </div>
    {:else if connectionError}
      <div class="error-box">
        <WifiOff class="w-12 h-12 mx-auto mb-4 text-red-600" />
        <h3 class="text-xl font-bold mb-2">Connection Error</h3>
        <p class="mb-4">{connectionError}</p>
        <button class="btn btn-primary" on:click={() => goto('/')}>
          Return Home
        </button>
      </div>
    {:else}
      <div class="token-box">
        <div class="connection-status">
          {#if peerStatus === 'connected'}
            <Wifi class="w-5 h-5 text-green-400" />
            <span class="text-sm text-green-100">Connected</span>
          {:else}
            <Loader class="w-5 h-5 animate-spin text-yellow-400" />
            <span class="text-sm text-yellow-100">Connecting...</span>
          {/if}
        </div>

        <div class="token-display">
          <span class="label">Game ID:</span>
          <span class="token">{token}</span>
          <button
            class="copy-btn"
            on:click={handleCopyToken}
            title="Copy game ID"
          >
            <Copy class="w-5 h-5" />
          </button>
        </div>

        {#if showCopied}
          <div class="copied-message">Copied to clipboard!</div>
        {/if}

        <p class="share-text">Share this ID with other players to join</p>

        {#if isHost}
          <button class="btn-share" on:click={handleCopyLink}>
            <Copy class="w-4 h-4" />
            {shareLabel}
          </button>
        {/if}
      </div>

      <div class="info-box">
        <h3 class="info-title">Language: {language}</h3>
        {#if isHost}
          <p class="text-sm text-indigo-700 mt-1">
            {connectedPeers} player{connectedPeers !== 1 ? 's' : ''} connected via WebRTC
          </p>
        {/if}
      </div>

      <div class="players-section">
        <h2 class="section-title">
          <Users class="inline-block w-6 h-6" />
          Players ({players.length}/4)
        </h2>

        <div class="players-list">
          {#each players as player}
            <div class="player-card">
              <div class="player-name">
                {player.name}
                {#if player.isHost}
                  <span class="host-badge">Host</span>
                {/if}
              </div>
            </div>
          {/each}

          {#if players.length < 4}
            {#each Array(4 - players.length) as _}
              <div class="player-card empty">
                <div class="waiting-text">
                  <Loader class="w-5 h-5 animate-spin" />
                  Waiting for player...
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      {#if isHost}
        <button
          class="btn btn-primary"
          on:click={handleStartGame}
          disabled={players.length < 2}
        >
          <Play class="w-5 h-5" />
          Start Game
        </button>

        {#if players.length < 2}
          <p class="help-text">Need at least 2 players to start</p>
        {/if}
      {:else}
        <div class="waiting-box">
          <Loader class="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Waiting for host to start the game...</p>
        </div>
      {/if}

      <button class="btn btn-ghost" on:click={() => {cleanupSync(); goto('/');}}>
        Leave Lobby
      </button>
    {/if}
  </div>
</div>

<style lang="postcss">
  .container {
    @apply min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100;
    @apply flex items-center justify-center p-4;
  }

  .content {
    @apply max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6;
  }

  .title {
    @apply text-3xl md:text-4xl font-bold text-center text-indigo-900;
  }

  .loading-box {
    @apply bg-indigo-50 rounded-xl p-8 text-center text-indigo-800;
  }

  .error-box {
    @apply bg-red-50 border-2 border-red-300 rounded-xl p-8 text-center text-red-800;
  }

  .token-box {
    @apply bg-gradient-to-r from-indigo-500 to-purple-600;
    @apply rounded-xl p-6 text-white relative;
  }

  .connection-status {
    @apply absolute top-3 right-3 flex items-center gap-2;
  }

  .token-display {
    @apply flex items-center justify-center gap-3 mb-2 flex-wrap;
  }

  .label {
    @apply text-sm font-semibold opacity-90;
  }

  .token {
    @apply text-sm md:text-base font-bold font-mono break-all;
  }

  .copy-btn {
    @apply p-2 hover:bg-white/20 rounded-lg transition-colors;
  }

  .copied-message {
    @apply text-center text-sm bg-white/20 rounded-lg py-2 mb-2;
  }

  .share-text {
    @apply text-center text-sm opacity-90 mb-3;
  }

  .btn-share {
    @apply w-full bg-white/20 hover:bg-white/30;
    @apply px-4 py-2 rounded-lg font-semibold;
    @apply transition-all duration-200;
    @apply flex items-center justify-center gap-2;
  }

  .info-box {
    @apply bg-indigo-50 rounded-lg p-4;
  }

  .info-title {
    @apply font-semibold text-indigo-900 text-center;
  }

  .players-section {
    @apply space-y-4;
  }

  .section-title {
    @apply text-xl font-bold text-gray-800 text-center;
  }

  .players-list {
    @apply grid grid-cols-1 md:grid-cols-2 gap-3;
  }

  .player-card {
    @apply bg-gradient-to-r from-green-100 to-green-50;
    @apply rounded-lg p-4 border-2 border-green-300;
  }

  .player-card.empty {
    @apply from-gray-100 to-gray-50 border-gray-300 border-dashed;
  }

  .player-name {
    @apply font-semibold text-gray-800 flex items-center gap-2;
  }

  .host-badge {
    @apply bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full;
  }

  .waiting-text {
    @apply text-gray-500 flex items-center gap-2 justify-center;
  }

  .btn {
    @apply w-full px-6 py-4 rounded-lg font-semibold;
    @apply transition-all duration-200;
    @apply flex items-center justify-center gap-2;
  }

  .btn-primary {
    @apply bg-indigo-600 text-white hover:bg-indigo-700;
    @apply shadow-lg hover:shadow-xl;
    @apply disabled:bg-gray-400 disabled:cursor-not-allowed;
  }

  .btn-ghost {
    @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
  }

  .waiting-box {
    @apply bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6;
    @apply text-yellow-800 text-center;
  }

  .help-text {
    @apply text-center text-sm text-gray-600;
  }
</style>
