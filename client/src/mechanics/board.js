// const boardSize = 15
//working, don\'t touch
export function setupBoard(boardSize){
  let board = [[]];
  let c = {cellValue: 1, wordValue: 1, taken: 0, cellChar: ''};
  for(let i=0;i<boardSize;i++){
    board[i] = []
    for(let j=0;j<boardSize;j++){
      board[i][j] = c
      if(i>=1 && i==j && i<boardSize-1 || i>=1 && i<boardSize-1 && j==boardSize-1-i){
        board[i][j] = {cellValue: 1, wordValue: 2, taken: 0, cellChar: ''}
      }
      if(i==Math.floor(boardSize/2)-6 || i==Math.floor(boardSize/2)+6){
        if(j==5 || j==9 ){
          board[i][j] = {cellValue: 3, wordValue: 1, taken: 0, cellChar: ''}
        }
      }
      if(i==Math.floor(boardSize/2)-2 || i==Math.floor(boardSize/2)+2){
        if(j==1 || j==5 || j==9 || j==13){
          board[i][j] = {cellValue: 3, wordValue: 1, taken: 0, cellChar: ''}
        }
      }
      if(i==0 && j==0 || i==0 && j==(Math.floor(boardSize/2)) || i==0 && j==boardSize-1 || i==(Math.floor(boardSize/2)) && j==boardSize-1 || i==(Math.floor(boardSize/2)) && j==0 || i==boardSize-1 && j==0 || i==boardSize-1 && j==boardSize-1 || i==boardSize-1 && j==0 || i==boardSize-1 && j==(Math.floor(boardSize/2))){
        board[i][j] = {cellValue: 1, wordValue: 3, taken: 0, cellChar: ''}
      }
      if(i==(Math.floor(boardSize/2)) && j == (Math.floor(boardSize/2))){
        board[i][j] = {cellValue: 1, wordValue: 2, taken: 0, cellChar: ''}
      }
      if(i==(Math.floor(boardSize/2)) || i==0 || i==boardSize-1){
        if(j==3 || j==11){
          board[i][j] = {cellValue: 2, wordValue: 1, taken: 0, cellChar: ''}
        }
      }
      if(i==(Math.floor(boardSize/2)-1)|| i==(Math.floor(boardSize/2)+1)){
        if(j==2 || j==6 || j==8 || j==12){
          board[i][j] = {cellValue: 2, wordValue: 1, taken: 0, cellChar: ''}
        }
      }
      if(i==(Math.floor(boardSize/2)-4) || i==(Math.floor(boardSize/2)+4)){
        if(j==0 || j==(Math.floor(boardSize/2)) || j==boardSize-1){
          board[i][j] = {cellValue: 2, wordValue: 1, taken: 0, cellChar: ''}
        }
      }
      if(i==(Math.floor(boardSize/2)-5) || i==(Math.floor(boardSize/2)+5)){
        if(j==(Math.floor(boardSize/2)-1) || j==(Math.floor(boardSize/2)+1)){
          board[i][j] = {cellValue: 2, wordValue: 1, taken: 0, cellChar: ''}
        }
      }
    }
  }
return board
}


export function updateBoard(board, boardSize, turn){
  for(let i=0;i<boardSize;i++){
    for(let j=0;j<boardSize;j++){
      if(turn.turn[i][j]!=null){
        board[i][j].cellChar = turn.turn[i][j]
        board[i][j].taken = 1
      }
    }
  }
  return board
}
