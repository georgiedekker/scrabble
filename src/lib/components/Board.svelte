<script>
  import { gameStore } from '../stores/gameStore.js';
  import { getLanguageConfig } from '../languages.js';
  import Tile from './Tile.svelte';

  export let onCellClick = null;
  export let temporaryPlacements = [];

  $: board = $gameStore.board;
  $: language = $gameStore.language;
  $: langConfig = getLanguageConfig(language);

  function getCellClass(type) {
    switch (type) {
      case 'TW':
        return 'bg-board-tw text-white text-xs font-bold';
      case 'DW':
        return 'bg-board-dw text-white text-xs font-bold';
      case 'TL':
        return 'bg-board-tl text-white text-xs font-bold';
      case 'DL':
        return 'bg-board-dl text-white text-xs font-bold';
      default:
        return 'bg-board-normal';
    }
  }

  function getCellLabel(type, row, col) {
    if (row === 7 && col === 7) return '★';
    switch (type) {
      case 'TW':
        return 'TW';
      case 'DW':
        return 'DW';
      case 'TL':
        return 'TL';
      case 'DL':
        return 'DL';
      default:
        return '';
    }
  }

  function handleCellClick(row, col) {
    if (onCellClick) {
      onCellClick(row, col);
    }
  }

  function getTileAtPosition(row, col) {
    // Check if there's a temporary placement
    const tempPlacement = temporaryPlacements.find(p => p.row === row && p.col === col);
    if (tempPlacement) return tempPlacement.tile;

    // Otherwise return the permanent tile
    return board[row][col].tile;
  }

  function isTemporaryPlacement(row, col) {
    return temporaryPlacements.some(p => p.row === row && p.col === col);
  }
</script>

<div class="board-container">
  <div class="board">
    {#each board as row, rowIndex}
      {#each row as cell, colIndex}
        <button
          class="cell {getCellClass(cell.type)}"
          class:has-tile={cell.tile || isTemporaryPlacement(rowIndex, colIndex)}
          class:temporary={isTemporaryPlacement(rowIndex, colIndex)}
          on:click={() => handleCellClick(rowIndex, colIndex)}
          disabled={cell.locked}
        >
          {#if getTileAtPosition(rowIndex, colIndex)}
            {@const tile = getTileAtPosition(rowIndex, colIndex)}
            <Tile
              letter={tile.letter}
              points={tile.points}
              isBlank={tile.isBlank}
              size="small"
            />
          {:else}
            <span class="cell-label">
              {getCellLabel(cell.type, rowIndex, colIndex)}
            </span>
          {/if}
        </button>
      {/each}
    {/each}
  </div>
</div>

<style>
  .board-container {
    @apply w-full h-full flex items-center justify-center p-2;
    @apply overflow-auto;
  }

  .board {
    @apply grid gap-[1px] bg-gray-400 border-4 border-gray-600 rounded-lg;
    @apply shadow-2xl;
    grid-template-columns: repeat(15, minmax(0, 1fr));
    grid-template-rows: repeat(15, minmax(0, 1fr));
    aspect-ratio: 1;
    max-width: min(90vw, 90vh);
    max-height: min(90vw, 90vh);
  }

  .cell {
    @apply aspect-square flex items-center justify-center;
    @apply transition-all duration-150;
    @apply relative;
    min-width: 0;
    min-height: 0;
  }

  .cell:not(.has-tile):not(:disabled):hover {
    @apply brightness-110 cursor-pointer;
  }

  .cell:disabled {
    @apply cursor-not-allowed;
  }

  .cell.has-tile {
    @apply bg-board-normal;
  }

  .cell.temporary {
    @apply ring-2 ring-yellow-400 ring-inset;
  }

  .cell-label {
    @apply text-[8px] md:text-xs font-bold select-none;
  }

  @media (max-width: 640px) {
    .board {
      gap: 0.5px;
      border-width: 2px;
    }

    .cell-label {
      font-size: 6px;
    }
  }
</style>
