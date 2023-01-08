export function createPlayer(name, rack){
 let player = {
    name: name,
    score: 0,
    wins: 0,
    rack: rack
  }
  // players.add(player)
  return player
}

export function updatePlayer(player, score, win, rack){
  player.score = player.score+score
  if(win!=null){
  player.wins = player.wins+win
  }
  player.rack = rack
  return player
}
// export function updatePlayerRack(player, rack){
//   player.rack = rack
//   return player
// }