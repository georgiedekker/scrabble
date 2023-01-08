import { setupBoard, updateBoard } from "./board.js";
import { createRack, updateRackOrder } from "./rack.js";
import { initTurn, checkTurn, calculateTurnScore } from "./turn.js";
import { createPlayer, updatePlayer } from "./players.js";

export const tiles = ['A','A','A','A','A','A','A','A','A','B','B','C','C','D','D','D','D','E','E','E','E','E','E','E','E','E','E','E','E','F','F','G','G','G','H','H','I','I','I','I','I','I','I','I','I','J','K','L','L','L','L','M','M','N','N','N','N','N','N','O','O','O','O','O','O','O','O','P','P','Q','R','R','R','R','R','R','S','S','S','S','T','T','T','T','T','T','U','U','U','U','V','V','W','W','X','Y','Y','Z','BLANK','BLANK'];
export let tilesAvailable = ['A','A','A','A','A','A','A','A','A','B','B','C','C','D','D','D','D','E','E','E','E','E','E','E','E','E','E','E','E','F','F','G','G','G','H','H','I','I','I','I','I','I','I','I','I','J','K','L','L','L','L','M','M','N','N','N','N','N','N','O','O','O','O','O','O','O','O','P','P','Q','R','R','R','R','R','R','S','S','S','S','T','T','T','T','T','T','U','U','U','U','V','V','W','W','X','Y','Y','Z','BLANK','BLANK'];
const tilePoints = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};
export const boardSize = 15;
export const tileSize = 15;
let turnScore = 0;
let win = 0;
let wordList = [];
let rack = null;
let name = 'Jack';

//game start
export let board = setupBoard(boardSize);
let players = []
let player = createPlayer(name, createRack(tilesAvailable))
players.add(player)
export let turn = initTurn(boardSize, player.name);


//rack changes
for(let r=0;r<players.length;r++){
  if(player.lifted!=null){
    player.rack = updateRackOrder(player.rack, player.lifted)
  }
}

//turns
if(turn!=null){
  wordList = checkTurn(board, turn)
  if(wordList.length!=0){
    turnScore = calculateTurnScore(wordList, tilePoints)
    if(turnScore>0){
      board = updateBoard(board, boardSize, turn)
    }
  }
  turn = null
}


//game end
if(tilesAvailable.length==0 && turn.length>0){
  win = win + 1
  player = turn.player
  for(let z=0;z<players.length;z++){
    if(players[z].name == player){
      updatePlayer(players[z], turnScore, win, rack)
    }
  }
  board = setupBoard(boardSize)
  turn = initTurn(boardSize);
  
}