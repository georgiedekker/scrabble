<template>
  <h1>Scrabble</h1>
  <scoreBoard />
  <br/>
  <gameBoard />
  <br/>
  <tileRack />
</template>

<script>
import scoreBoard from './components/scoreBoard.vue';
import gameBoard from './components/gameBoard.vue';
import tileRack from './components/tileRack.vue';

export default {
  name: 'App',
  components: {
    scoreBoard,
    gameBoard,
    tileRack
  },
  tiles: ['A','A','A','A','A','A','A','A','A','B','B','C','C','D','D','D','D','E','E','E','E','E','E','E','E','E','E','E','E','F','F','G','G','G','H','H','I','I','I','I','I','I','I','I','I','J','K','L','L','L','L','M','M','N','N','N','N','N','N','O','O','O','O','O','O','O','O','P','P','Q','R','R','R','R','R','R','S','S','S','S','T','T','T','T','T','T','U','U','U','U','V','V','W','W','X','Y','Y','Z','BLANK','BLANK'],
  tilePoints: {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10},
  boardSize: 15,
  tileSize: 15
}

//list of stuff that needs to be implemented
//01. draw a board - on some canvas, choose library
//02. draw a rack
//03. draw tiles - svg tiles - https://suncatcherstudio.com/image-editor/ <-- need to be cleaned up
//04. draggable tiles - https://github.com/svgdotjs/svg.draggable.js?files=1
//05. place tiles on board - with SVG animation
//06. socket to emit board changes to other players and receive from other players
//07. implement state management with vuex
//08. implement score board
//09. implement better and multi-lingual wordcheckers - https://github.com/OpenTaal/opentaal-wordlist
//10. fix not checking some words because it's the same word but in a different location


//State Management
//Objects that need only local state:
//  tileRack, gameBoard
//Objects that need the state broadcasted to other players:
// turn, optional:tile{cellChar, x, y}, player, tilesAvailable


</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#scoreBoard{
  width: 80vw;
  height: 20%;
  position: inline;
}
#gameBoard{
  width: 80vw;
  height: 60vh;
  position: inline;
}
#tileRack{
  width: 80vw;
  height: 20vh;
  position: inline;
}
</style>


