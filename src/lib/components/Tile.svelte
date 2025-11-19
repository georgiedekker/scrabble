<script>
  export let letter = '';
  export let points = 0;
  export let isBlank = false;
  export let size = 'normal'; // 'small', 'normal', 'large', 'fill'
  export let draggable = false;
  export let selected = false;

  const sizeClasses = {
    fill: 'w-full h-full text-[0.6em]',
    small: 'w-8 h-8 text-sm',
    normal: 'w-12 h-12 text-lg',
    large: 'w-16 h-16 text-xl'
  };

  const pointsSizeClasses = {
    fill: 'text-[0.35em]',
    small: 'text-[8px]',
    normal: 'text-[10px]',
    large: 'text-xs'
  };
</script>

<div
  class="tile {sizeClasses[size]} {selected ? 'ring-2 ring-blue-500' : ''}"
  class:draggable
  class:blank={isBlank}
  role={draggable ? 'button' : 'none'}
  tabindex={draggable ? 0 : -1}
  on:mousedown
  on:touchstart
>
  <div class="tile-content">
    <span class="tile-letter">{letter === '_' ? '' : letter}</span>
    {#if !isBlank && letter !== '_'}
      <span class="tile-points {pointsSizeClasses[size]}">{points}</span>
    {/if}
  </div>
</div>

<style>
  .tile {
    @apply relative rounded bg-tile-bg border-2 border-tile-text shadow-md;
    @apply flex items-center justify-center font-bold select-none;
    @apply transition-all duration-200;
    touch-action: none;
  }

  .tile.draggable {
    @apply cursor-grab active:cursor-grabbing;
  }

  .tile.draggable:hover {
    @apply scale-105 shadow-lg;
  }

  .tile.draggable:active {
    @apply scale-95;
  }

  .tile.blank {
    @apply bg-yellow-100;
  }

  .tile-content {
    @apply relative w-full h-full flex items-center justify-center;
  }

  .tile-letter {
    @apply text-tile-text font-bold;
  }

  .tile-points {
    @apply absolute bottom-0.5 right-0.5 text-tile-text font-normal;
  }
</style>
