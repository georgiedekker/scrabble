

// let rack = {0: 'B', 1: 'C', 2: 'D', 3: 'E', 4: 'F', 5: 'G', 6: 'A'}
// export let tilesAvailable = ['A','A','A','A','A','A','A','A','A','B','B','C','C','D','D','D','D','E','E','E','E','E','E','E','E','E','E','E','E','F','F','G','G','G','H','H','I','I','I','I','I','I','I','I','I','J','K','L','L','L','L','M','M','N','N','N','N','N','N','O','O','O','O','O','O','O','O','P','P','Q','R','R','R','R','R','R','S','S','S','S','T','T','T','T','T','T','U','U','U','U','V','V','W','W','X','Y','Y','Z','BLANK','BLANK'];
// let lifted = {index: 3, value: rack[Math.floor(Math.random()*Object.values(rack).length)]}
// let rack = createRack()
// let lifted = {index:2, value: rack[2]}
// console.log('lifted.index: '+lifted.index)
// console.log(updateRackOrder(rack, {index:2, value: rack[2]}, null))

function reduceTiles(tilesAvailable, tileUsed){
  tilesAvailable.splice(tilesAvailable.findIndex(function(tile){tileUsed == tile; return tile}),1)
  return tilesAvailable
}

export function createRack(tilesAvailable){
  let rack = {0: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: ''}
  rack = fillRack(tilesAvailable, rack)
  return rack
}

function fillRack(tilesAvailable, rack){
  // console.log(tilesAvailable.length)
  for(let j=0;j<Object.keys(rack).length;j++){
    if(rack[j]==''){
    rack[j] = tilesAvailable[Math.floor(Math.random()*tilesAvailable.length)]
    reduceTiles(tilesAvailable, rack[j])
    }
  }
  return rack
}


//updateRackOrder working don't touch
export function updateRackOrder(tilesAvailable, rack, lifted, inIndex){
  let newRack = {}
  let outIndex = lifted.index
  // let inIndex = Object.values(rack).findIndex(item => item==lifted.value)
  if(inIndex==null){ 
    for(let b=0;b<outIndex;b++){
      newRack[b] = rack[b]
    }
    // console.log('first part of rack: '+JSON.stringify(newRack)+' '+Object.keys(rack).length)
    for(let l=outIndex; l<Object.keys(rack).length-1;l++){
      newRack[l] = rack[l+1]
    }
    // console.log('second part of rack: '+JSON.stringify(newRack))
    newRack[Object.keys(rack).length-1] = ''
    newRack = fillRack(tilesAvailable, newRack)
    // console.log('final rack: '+JSON.stringify(newRack))
    return newRack
  }
  if(inIndex == outIndex){ return rack }
  if(inIndex != outIndex){
    if(outIndex < inIndex){
      if(outIndex > 0){
        for(let k=0; k<outIndex; k++){
          newRack[k] = rack[k]
        }
      }
      for(let m=outIndex;m<inIndex;m++){
        newRack[m+1] = rack[m]
      }
      if(outIndex == 0){
        newRack[outIndex] = rack[outIndex]
      }
      newRack[outIndex] = rack[inIndex]
      if(inIndex+1 < Object.keys(rack).length){
        for(let n=inIndex+1; n<Object.keys(rack).length;n++){
          newRack[n] = rack[n]
        }
      }
    }
    if(outIndex > inIndex){
      //e.g. moving outIndex 5 to 6, which means moving 6 to 5
      for(let o=0;o<inIndex;o++){
        newRack[o] = rack[o]
      }
      newRack[outIndex] = rack[inIndex]
      for(let p=outIndex+1;p<Object.keys(rack).length;p++){
        newRack[p] = rack[p]
      }
      newRack[inIndex] = rack[outIndex]
    }
  }
  return newRack
}