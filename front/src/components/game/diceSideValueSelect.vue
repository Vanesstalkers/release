<template>
  <div class="select-side-value">
    <div class="el" v-on:click="e => selectValue(e, 0)" value="0" />
    <div class="el" v-on:click="e => selectValue(e, 1)" value="1" />
    <div class="el" v-on:click="e => selectValue(e, 2)" value="2" />
    <div class="el" v-on:click="e => selectValue(e, 3)" value="3" />
    <div class="el" v-on:click="e => selectValue(e, 4)" value="4" />
    <div class="el" v-on:click="e => selectValue(e, 5)" value="5" />
    <div class="el" v-on:click="e => selectValue(e, 6)" value="6" />
  </div>
</template>

<script>
export default {
  props: {},
  computed: {},
  methods: {
    selectValue(event, value) {
      event.stopPropagation();
      this.$emit('select', value);
    },
  },
  mounted() {},
};
</script>

<style scoped>
.select-side-value {
  display: flex;
  height: 70px;
  position: absolute;
  top: -10px;
  right: 10px;
  box-shadow: 10px 10px 10px 0px black;
  background: black;
  border-radius: 5px;
  z-index: 2;
}
#game.mobile-view.portrait-view .select-side-value {
  transform: rotate(90deg);
  transform-origin: right bottom;
}
.el {
  position: relative;
  flex-shrink: 0;
  float: left;
  width: 70px;
  height: 70px;
  background-image: url(../../assets/Dices.png);
  background-position: -497px;
  cursor: pointer;
}
.el:hover {
  opacity: 0.7;
}
.el[value='0'] {
  background-position: -0px;
}
.el[value='1'] {
  background-position: -71px;
}
.el[value='2'] {
  background-position: -142px;
}
.el[value='3'] {
  background-position: -213px;
}
.el[value='4'] {
  background-position: -284px;
}
.el[value='5'] {
  background-position: -355px;
}
.el[value='6'] {
  background-position: -426px;
}
</style>
