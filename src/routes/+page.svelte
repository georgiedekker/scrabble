<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { gameStore, currentSession } from '$lib/stores/gameStore.js';
  import { LANGUAGES } from '$lib/languages.js';
  import { Copy, Users, Globe } from 'lucide-svelte';
  import { copyToClipboard } from '$lib/utils.js';

  let mode = 'home'; // 'home', 'create', 'join'
  let playerName = '';
  let selectedLanguage = 'EN';
  let gameToken = '';
  let showCopied = false;
  let error = '';

  function handleCreateGame() {
    mode = 'create';
    error = '';
  }

  function handleJoinGame() {
    mode = 'join';
    error = '';
  }

  function handleBack() {
    mode = 'home';
    error = '';
    gameToken = '';
  }

  async function createNewGame() {
    if (!playerName.trim()) {
      error = 'Please enter your name';
      return;
    }

    try {
      error = 'Initializing...';

      // First, initialize peer to get the peer ID
      const { initSyncAsHost } = await import('$lib/sync.js');
      const peerId = await initSyncAsHost();

      // Use the peer ID as the game token
      const result = gameStore.newGame(playerName.trim(), selectedLanguage);

      // Update the game with the peer ID as token
      gameStore.updateGameToken(peerId, result.sessionId);

      currentSession.set({
        sessionId: result.sessionId,
        playerName: playerName.trim(),
        gameToken: peerId
      });

      error = '';

      // Navigate to lobby
      goto(`/lobby/${peerId}`);
    } catch (err) {
      console.error('Failed to create game:', err);
      error = 'Failed to initialize connection. Please try again.';
    }
  }

  async function joinExistingGame() {
    if (!playerName.trim()) {
      error = 'Please enter your name';
      return;
    }

    if (!gameToken.trim()) {
      error = 'Please enter a game ID';
      return;
    }

    // With WebRTC, we don't check localStorage - we'll connect directly to peer
    // Generate a session ID for this player
    import('$lib/utils.js').then(({ generateSessionId }) => {
      const sessionId = generateSessionId();

      currentSession.set({
        sessionId,
        playerName: playerName.trim(),
        gameToken: gameToken.trim()
      });

      // Navigate to lobby where WebRTC connection will be established
      goto(`/lobby/${gameToken.trim()}`);
    });
  }

  async function handleCopy(text) {
    const success = await copyToClipboard(text);
    if (success) {
      showCopied = true;
      setTimeout(() => {
        showCopied = false;
      }, 2000);
    }
  }

  onMount(() => {
    // Clear any existing session on home page
    currentSession.set({
      sessionId: null,
      playerName: null,
      gameToken: null
    });
  });
</script>

<svelte:head>
  <title>Scrabble - Multilingual Multiplayer Game</title>
</svelte:head>

<div class="container">
  <div class="content">
    <h1 class="title">
      <Globe class="inline-block w-12 h-12 mb-2" />
      Scrabble
    </h1>
    <p class="subtitle">Multilingual Multiplayer Word Game</p>

    {#if mode === 'home'}
      <div class="home-screen">
        <button class="btn btn-primary" on:click={handleCreateGame}>
          <Users class="w-5 h-5" />
          Create New Game
        </button>

        <button class="btn btn-secondary" on:click={handleJoinGame}>
          Join Game
        </button>

        <div class="info-box">
          <h3 class="info-title">Supported Languages</h3>
          <div class="language-list">
            {#each Object.entries(LANGUAGES) as [code, lang]}
              <span class="language-tag">{lang.name}</span>
            {/each}
            <span class="language-tag">Multi-language</span>
          </div>
        </div>

        <div class="info-box">
          <h3 class="info-title">Features</h3>
          <ul class="feature-list">
            <li>2-4 players</li>
            <li>Real-time multiplayer</li>
            <li>Mobile & touch friendly</li>
            <li>No registration required</li>
          </ul>
        </div>
      </div>
    {/if}

    {#if mode === 'create'}
      <div class="form-screen">
        <h2 class="form-title">Create New Game</h2>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="form-group">
          <label for="name">Your Name</label>
          <input
            id="name"
            type="text"
            bind:value={playerName}
            placeholder="Enter your name"
            maxlength="20"
            class="input"
          />
        </div>

        <div class="form-group">
          <label for="language">Language</label>
          <select id="language" bind:value={selectedLanguage} class="input">
            {#each Object.entries(LANGUAGES) as [code, lang]}
              <option value={code}>{lang.name}</option>
            {/each}
            <option value="MULTI">Multi-language</option>
          </select>
        </div>

        <div class="button-group">
          <button class="btn btn-primary" on:click={createNewGame}>
            Create Game
          </button>
          <button class="btn btn-ghost" on:click={handleBack}>
            Back
          </button>
        </div>
      </div>
    {/if}

    {#if mode === 'join'}
      <div class="form-screen">
        <h2 class="form-title">Join Game</h2>

        {#if error}
          <div class="error">{error}</div>
        {/if}

        <div class="form-group">
          <label for="join-name">Your Name</label>
          <input
            id="join-name"
            type="text"
            bind:value={playerName}
            placeholder="Enter your name"
            maxlength="20"
            class="input"
          />
        </div>

        <div class="form-group">
          <label for="token">Game ID</label>
          <input
            id="token"
            type="text"
            bind:value={gameToken}
            placeholder="Enter game ID from host"
            class="input"
          />
        </div>

        <div class="button-group">
          <button class="btn btn-primary" on:click={joinExistingGame}>
            Join Game
          </button>
          <button class="btn btn-ghost" on:click={handleBack}>
            Back
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    @apply min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100;
    @apply flex items-center justify-center p-4;
  }

  .content {
    @apply max-w-md w-full bg-white rounded-2xl shadow-2xl p-8;
  }

  .title {
    @apply text-4xl md:text-5xl font-bold text-center text-indigo-900 mb-2;
  }

  .subtitle {
    @apply text-center text-gray-600 mb-8;
  }

  .home-screen {
    @apply space-y-4;
  }

  .form-screen {
    @apply space-y-6;
  }

  .form-title {
    @apply text-2xl font-bold text-indigo-900 mb-4;
  }

  .btn {
    @apply w-full px-6 py-4 rounded-lg font-semibold;
    @apply transition-all duration-200;
    @apply flex items-center justify-center gap-2;
  }

  .btn-primary {
    @apply bg-indigo-600 text-white hover:bg-indigo-700;
    @apply shadow-lg hover:shadow-xl;
  }

  .btn-secondary {
    @apply bg-green-600 text-white hover:bg-green-700;
    @apply shadow-lg hover:shadow-xl;
  }

  .btn-ghost {
    @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
  }

  .form-group {
    @apply space-y-2;
  }

  .form-group label {
    @apply block text-sm font-semibold text-gray-700;
  }

  .input {
    @apply w-full px-4 py-3 border-2 border-gray-300 rounded-lg;
    @apply focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200;
    @apply transition-all duration-200;
  }

  .button-group {
    @apply space-y-2;
  }

  .error {
    @apply bg-red-100 border border-red-400 text-red-700;
    @apply px-4 py-3 rounded-lg;
  }

  .info-box {
    @apply bg-indigo-50 rounded-lg p-4;
  }

  .info-title {
    @apply font-semibold text-indigo-900 mb-2;
  }

  .language-list {
    @apply flex flex-wrap gap-2;
  }

  .language-tag {
    @apply bg-indigo-200 text-indigo-800 px-3 py-1 rounded-full text-sm;
  }

  .feature-list {
    @apply list-disc list-inside text-gray-700 space-y-1;
  }
</style>
