<script>
  import { getLanguageConfig } from '../languages.js';
  import Tile from './Tile.svelte';

  export let tiles = [];
  export let language = 'EN';
  export let onTileSelect = null;
  export let onDragStart = null;
  export let selectedIndex = -1;
  export let disabled = false;

  $: langConfig = getLanguageConfig(language);

  function handleTileClick(index) {
    if (disabled) return;
    if (onTileSelect) {
      onTileSelect(index);
    }
  }

  function getTileData(letter) {
    return {
      letter,
      points: langConfig.points[letter] || 0,
      isBlank: letter === '_'
    };
  }

  // Drag and drop support
  let draggedIndex = -1;
  let dragOverIndex = -1;

  function handleDragStart(event, index) {
    if (disabled) return;
    draggedIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
    event.dataTransfer.setData('application/json', JSON.stringify({
      index,
      letter: tiles[index],
      tileData: getTileData(tiles[index])
    }));

    // Notify parent component
    if (onDragStart) {
      onDragStart(index, tiles[index]);
    }

    // For touch devices the element styling already sets touch-action to none
  }

  function handleDragOver(event, index) {
    if (disabled || draggedIndex === -1) return;
    event.preventDefault();
    dragOverIndex = index;
  }

  function handleDrop(event, index) {
    if (disabled || draggedIndex === -1) return;
    event.preventDefault();

    if (draggedIndex !== index) {
      // Reorder tiles
      const newTiles = [...tiles];
      const [removed] = newTiles.splice(draggedIndex, 1);
      newTiles.splice(index, 0, removed);
      tiles = newTiles;
    }

    draggedIndex = -1;
    dragOverIndex = -1;
  }

  function handleDragEnd() {
    draggedIndex = -1;
    dragOverIndex = -1;
  }

  // Touch support
  let touchStartPos = null;
  let touchElement = null;

  function handleTouchStart(event, index) {
    if (disabled) return;
    const touch = event.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    draggedIndex = index;
    touchElement = event.currentTarget;
  }

  function handleTouchMove(event) {
    if (disabled || draggedIndex === -1 || !touchStartPos) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);

    // Only prevent default if significant movement (allows tap)
    if (deltaX > 10 || deltaY > 10) {
      event.preventDefault();

      // Find which tile we're over
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const rackTile = elements.find(el => el.classList.contains('rack-tile'));
      if (rackTile) {
        const index = parseInt(rackTile.dataset.index);
        if (!isNaN(index)) {
          dragOverIndex = index;
        }
      }
    }
  }

  function handleTouchEnd(event) {
    if (disabled) return;

    if (dragOverIndex !== -1 && draggedIndex !== -1 && dragOverIndex !== draggedIndex) {
      // Reorder tiles
      const newTiles = [...tiles];
      const [removed] = newTiles.splice(draggedIndex, 1);
      newTiles.splice(dragOverIndex, 0, removed);
      tiles = newTiles;
    }

    draggedIndex = -1;
    dragOverIndex = -1;
    touchStartPos = null;
    touchElement = null;
  }
</script>

<div class="tile-rack" class:disabled>
  <div class="rack-inner">
    {#each tiles as letter, index}
      {@const tileData = getTileData(letter)}
      <div
        class="rack-tile"
        class:dragging={draggedIndex === index}
        class:drag-over={dragOverIndex === index}
        class:selected={selectedIndex === index}
        data-index={index}
        draggable={!disabled}
        on:dragstart={(e) => handleDragStart(e, index)}
        on:dragover={(e) => handleDragOver(e, index)}
        on:drop={(e) => handleDrop(e, index)}
        on:dragend={handleDragEnd}
        on:touchstart|passive={(e) => handleTouchStart(e, index)}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
        on:click={() => handleTileClick(index)}
        on:keydown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTileClick(index);
          }
        }}
        role="button"
        tabindex={disabled ? -1 : 0}
      >
        <Tile
          letter={tileData.letter}
          points={tileData.points}
          isBlank={tileData.isBlank}
          draggable={!disabled}
          selected={selectedIndex === index}
        />
      </div>
    {/each}

    {#if tiles.length < 7}
      {#each Array(7 - tiles.length) as _, i}
        <div class="rack-tile empty">
          <div class="empty-slot"></div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style lang="postcss">
  .tile-rack {
    @apply w-full p-4 bg-gradient-to-b from-amber-700 to-amber-900;
    @apply rounded-lg shadow-lg border-4 border-amber-800;
  }

  .tile-rack.disabled {
    @apply opacity-50 pointer-events-none;
  }

  .rack-inner {
    @apply flex gap-2 justify-center items-center;
    @apply flex-wrap md:flex-nowrap;
  }

  .rack-tile {
    @apply transition-all duration-200;
    @apply touch-none;
    transform: translateY(0) scale(1);
    will-change: transform, box-shadow, opacity;
  }

  .rack-tile.dragging {
    @apply opacity-60;
    transform: translateY(-6px) scale(1.08) rotate(-2deg);
    box-shadow: 0 18px 30px rgba(0, 0, 0, 0.25);
  }

  .rack-tile.drag-over {
    @apply scale-110;
  }

  .rack-tile.selected {
    @apply scale-105;
  }

  .rack-tile.empty {
    @apply opacity-30;
  }

  .empty-slot {
    @apply w-12 h-12 rounded border-2 border-dashed border-amber-600;
    @apply bg-amber-800/30;
  }

  @media (max-width: 640px) {
    .tile-rack {
      @apply p-2;
    }

    .rack-inner {
      @apply gap-1;
    }
  }
</style>
