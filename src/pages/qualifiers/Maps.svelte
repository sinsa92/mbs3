<script lang="ts">
  import Map from '../../components/molecules/Map.svelte';
  import ScoreRow from '../../components/molecules/ScoreRow.svelte';
  import { me, players } from '../../stores/core';
  import {
    regularMapRanking,
    regularPlayerRanking,
    myQualifier,
    init,
    initMyQualifier
  } from '../../stores/qualifiers/scores';

  let hiddenMaps = {};
  const toggleHidden = map => {
    hiddenMaps = {
      ...hiddenMaps,
      [map.id]: !hiddenMaps[map.id]
    }
  }

  $: if (!$regularMapRanking && $players) init($players);
  $: if (!$myQualifier && $regularPlayerRanking && $me) initMyQualifier($regularPlayerRanking, $me);
</script>

<div class="links">
  <a href="#/qualifiers">Player rankings</a>
  <a href="#/qualifiers!lobbies">Qualifier lobbies</a>
  <a href="#/qualifiers!elite!maps">Elite players</a>
</div>
{#if !$regularMapRanking}
  <p class="lobbies">Loading qualifier scores...</p>
{:else}
  <p class="maps">
  {#each $regularMapRanking as map (map.id)}
    <Map {map} />
    {#if $myQualifier}
      <div class="my-qualifier">
        <ScoreRow player={$myQualifier} score={$myQualifier.mapScores.get(map.id)[0]} />
      </div>
    {/if}
    <a href="javascript:void(0)" on:click={() => toggleHidden(map)}>
      {hiddenMaps[map.id] ? 'Show' : 'Hide'} scores
    </a>
    {#if !hiddenMaps[map.id]}
      {#each Array.from(map.players.values()) as player (player.id)}
        <ScoreRow {player} score={player.mapScores.get(map.id)[0]} />
      {/each}
    {/if}
  {/each}
  </p>
{/if}

<style>
  .maps {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1em;
  }
  .maps :global(.map) {
    margin: 1em 0;
  }
  .links {
    font-size: 1.25em;
    display: flex;
    width: 30em;
    justify-content: space-between;
    margin: auto;
  }
  .my-qualifier {
    font-size: 1.125em;
    margin-bottom: .5em;
  }
</style>