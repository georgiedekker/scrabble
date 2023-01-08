<template>
    <p> Did I win? </p>
    <table>
      <tbody>
    <tr v-for="row in boardSize" :key="row">
      <td v-for="cell in boardSize" :key="row+cell">{{ row+cell }}
        <tileDefinition/>
        </td>
        </tr>
      </tbody>
      </table>
</template>

<script>
import tileDefinition from './tile.vue';
export default {
  name: 'gameBoard',
  components:[
    tileDefinition
  ],
  data(){  
    return {
    boardSize: 15,
    tile: true
  }
  }
}
</script>
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

table {
  min-width: 100%;
  min-height: 100%;
  display: inline;
  align-items: align-center;
}
tbody{
  width: 100%;
  display: inline;
}
td {
  color: blue;
}
</style>