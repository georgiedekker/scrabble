


//turn is the state after the player put down the tiles on the board

//1. Check if the word that the user placed is a word in a dictionary
//   This will be the longest sequence of characters that were place in the turn in either LTR or UTD direction
//2. Check LTR and UTD for words that were created by the tiles placed by the player in this turn in combination with the pre-turn board state
//   This can be extensions to words, previxes, and just words
//3. Every detected word needs to be checked against a dictionary
//4. Update the player score
//5. Decide if the player won
//6. Update the board state to include the last turn

// let dummy = {start:[1,1], direction:'horizontal'}
// console.log(checkWord([[{taken:1}]], 'turn', dummy))

export function initTurn(boardSize, playerName){
  let turn = {player: playerName, turn: [[]]}
  //create empty turn
  if(turn.turn.length==0){
    for(let i=0;i<boardSize;i++){
      turn.turn[i] = []
      for(let j=0;j<boardSize;j++){
        turn.turn[i][j] = null
      }
    }
  }
  return turn
}


export function checkTurn(board, turn){
  let wordList = []
  let word = {}
  for(let i=0;i<turn.turn.length;i++){
    for(let j=0;j<turn.turn[0].length;j++){
      if(turn.turn[i][j]!=null){
        //horizontal
        if(turn.turn[i][j+1]!=null){
          word = checkWord(board, turn, {direction: 'horizontal', start:[i,j]})
          if(word==null){ return null }
          i++
        }
        //vertical
        if(turn.turn[i+1][j]!=null){
          word = checkWord(board, turn, {direction: 'vertical', start:[i,j]})
          if(word==null){ return null }
          j++
        }
      }
      if(!wordList.includes(word)){
        wordList << word
      }
      if(wordList.length==0){
        // one character added in turn
        word = checkWord(board, turn, {direction: 'horizontal', start:[i,j]})
        if(word==null){ return null }
        if(!wordList.includes(word)){
          wordList << word
        }
        word = checkWord(board, turn, {direction: 'vertical', start:[i,j]})
        if(word==null){ return null }
        if(!wordList.includes(word)){
          wordList << word
        }
      }
    }
  }
  return wordList
}



function checkWord(board, turn, {start, direction}){
  let word = []
  let e = start[0]
  let f = start[1]
  let i = start[0]-1
  let j = start[1]-1
  if(direction=='horizontal'){
    console.log('direction: '+board[i][j].taken)
    //check left
    while(board[i][j].taken==1){
      word.unshift({cellValue: 1, wordValue: 1, taken: 1, cellChar: board[i][j]})
      j--
    }
    //check right
    while(turn.turn[e][f]!=null || turn.turn[e][f]!=''){
      word << {cellValue: board[e][f].cellValue, wordValue: board[e][f].wordValue, taken: 1, cellChar: turn.turn[e][f]}
      f++
    }
  }
  if(direction=='vertical'){
    console.log('direction: '+start)
    //check up
    while(board[i][j].taken==1){
      word.unshift({cellValue: 1, wordValue: 1, taken: 1, cellChar: board[i][j]})
      i--
    }
    //check down
    while(turn.turn[e][f]!=null){
      word << {cellValue: board[e][f].cellValue, wordValue: board[e][f].wordValue, taken: 1, cellChar: turn.turn[e][f]}
      e++
    }
  }
  let dc = dictionaryCheck(word)
  if(dc){
  return word
  }
}


function dictionaryCheck(word){
  let wo = [];
  let validation = false;
  console.log(word[1].cellChar)
  for(let w=0;w<word.length;w++){
    wo = wo + word[w].cellChar
  }
  console.log(wo.length)
  if(wo.length>2){
    validation = call(wo)
  }
  console.log(wo)
  return validation
}


function calculateWordScore(word, tilePoints){
    let wordMultiplierList = new Array;
    let wordMultiplier = 0;
    let wordScore = 0;
    let charValue = 0;
    for(let k=0;k<word.length;k++){
      wordMultiplierList.push(word[k].wordValue)
      charValue = charValue + tilePoints[(word[k].cellChar.toUpperCase())]
    }
    wordMultiplier = Math.max(...wordMultiplierList)
    // console.log('wordMultiplier: '+wordMultiplier)
    wordScore = charValue * wordMultiplier
    // console.log('wordValue: '+wordValue)
    return wordScore
}
// let word = [{cellChar:'t', cellValue:1, wordValue: 1},{cellChar:'h', cellValue:1, wordValue: 1},{cellChar:'e', cellValue:1, wordValue: 2}]
// console.log(calculateWordScore(word))

export function calculateTurnScore(wordList, tilePoints){
  let turnScore = 0;
  let wordScore = 0;
  for(let r=0; r<wordList.length;r++){
    wordScore = calculateWordScore(wordList[r], tilePoints)
    if(wordScore==0) {return 0}
    turnScore = turnScore + wordScore
  }
  return turnScore
}





// call('word')
async function call(wo){
  let url = null;
  // url = new Request(`https://scrabblewordfinder.org/check${wo}`);
  url = new Request(`https://s3-us-west-2.amazonaws.com/words.alexmeub.com/otcwl2018/${wo}.json`);
  // let method = 'Post';
  let method = 'GET';
  const headers = new Headers();
  headers.append('Accept','*/*');
  let output = null;
  if(method == 'POST'){
    output = await fetch(url, {method:method,headers:headers, body: JSON.stringify({ wo }) }).then(response => response.json().then(data => { return data}))
  }
  if(method == 'GET'){
    await fetch(url, {method:method,headers:headers }).then(response => {
      let contentType = response.headers.get("content-type");
      if(contentType && contentType.indexOf("application/json") !== -1) {
      output = response.json().then(data => { 
        // console.log('data: '+JSON.stringify(data));
        return data })
      output = true
      }
      else{
        // response.text().then(text => {
          output = false
        // })
      }
    })
  console.log(output)
  return output
  // await fetch(`https://api.opensea.io/api/v1/collections?asset_owner=${owner}&offset=0&limit=300`);
    
  }
}