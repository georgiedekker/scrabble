<script>
  import { gameStore } from '../stores/gameStore.js';
  import { getLanguageConfig } from '../languages.js';
  import Tile from './Tile.svelte';

  export let onCellClick = null;
  export let onCellDrop = null;
  export let temporaryPlacements = [];

  $: board = $gameStore.board;
  $: language = $gameStore.language;
  $: langConfig = getLanguageConfig(language);
  $: allTemporaryPlacements = $gameStore.temporaryPlacements || {};

  let dragOverCell = null;

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
    // Check if there's a temporary placement from current player first
    const tempPlacement = temporaryPlacements.find(p => p.row === row && p.col === col);
    if (tempPlacement) return tempPlacement.tile;

    // Check all other players' temporary placements
    for (const sessionId in allTemporaryPlacements) {
      const placements = allTemporaryPlacements[sessionId];
      const otherPlacement = placements?.find(p => p.row === row && p.col === col);
      if (otherPlacement) return otherPlacement.tile;
    }

    // Otherwise return the permanent tile
    return board[row][col].tile;
  }

  function isTemporaryPlacement(row, col) {
    // Check current player's placements
    if (temporaryPlacements.some(p => p.row === row && p.col === col)) {
      return true;
    }

    // Check all other players' temporary placements
    for (const sessionId in allTemporaryPlacements) {
      const placements = allTemporaryPlacements[sessionId];
      if (placements?.some(p => p.row === row && p.col === col)) {
        return true;
      }
    }

    return false;
  }

  function handleDragOver(event, row, col) {
    const cell = board[row][col];

    // Only allow drop on empty, unlocked cells
    if (cell.locked || cell.tile || isTemporaryPlacement(row, col)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    dragOverCell = { row, col };
  }

  function handleDragLeave() {
    dragOverCell = null;
  }

  function handleDrop(event, row, col) {
    event.preventDefault();
    dragOverCell = null;

    const cell = board[row][col];

    // Only allow drop on empty, unlocked cells
    if (cell.locked || cell.tile || isTemporaryPlacement(row, col)) {
      return;
    }

    try {
      const data = event.dataTransfer.getData('application/json');
      if (data && onCellDrop) {
        const tileData = JSON.parse(data);
        onCellDrop(row, col, tileData);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  }

  function isDragOver(row, col) {
    return dragOverCell && dragOverCell.row === row && dragOverCell.col === col;
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
          class:drag-over={isDragOver(rowIndex, colIndex)}
          on:click={() => handleCellClick(rowIndex, colIndex)}
          on:dragover={(e) => handleDragOver(e, rowIndex, colIndex)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, rowIndex, colIndex)}
          disabled={cell.locked}
        >
          {#if getTileAtPosition(rowIndex, colIndex)}
            {@const tile = getTileAtPosition(rowIndex, colIndex)}
            <Tile
              letter={tile.letter}
              points={tile.points}
              isBlank={tile.isBlank}
              size="fill"
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
    @apply w-full h-full flex items-center justify-center;
    @apply overflow-visible;
    padding: 0;
  }

  .board {
    @apply grid gap-[1px] bg-gray-400 border-4 border-gray-600 rounded-lg;
    @apply shadow-2xl;
    grid-template-columns: repeat(15, minmax(0, 1fr));
    grid-template-rows: repeat(15, minmax(0, 1fr));
    aspect-ratio: 1;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .cell {
    @apply aspect-square flex items-center justify-center;
    @apply transition-all duration-150;
    @apply relative;
    min-width: 0;
    min-height: 0;
    font-size: clamp(12px, 3vw, 32px);
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

  .cell.drag-over {
    @apply ring-4 ring-blue-500 ring-inset brightness-110 scale-105;
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
