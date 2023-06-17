<template>
  <div
    v-if="zone._id"
    :style="{
      left: zone.left + 'px',
      top: zone.top + 'px',
      color: 'white',
      fontSize: '10px',
    }"
    :class="['zone', zone.vertical ? 'vertical' : '', zone.available ? 'available' : '']"
    v-on:click="putDice"
  >
    <div class="scroll-off wraper">
      <plane-zone-sides
        :linkLines="linkLines"
        :sideList="zone.sideList"
        :position="{ left: zone.left, top: zone.top, vertical: zone.vertical }"
      />
      <dice v-for="id in Object.keys(zone.itemMap)" :key="id" :diceId="id" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions, mapMutations } from 'vuex';
import planeZoneSides from './planeZoneSides.vue';
import dice from './dice.vue';

export default {
  components: {
    planeZoneSides,
    dice,
  },
  props: {
    zoneId: String,
    linkLines: Object,
  },
  computed: {
    ...mapGetters({
      getStore: 'getStore',
      pickedDiceId: 'pickedDiceId',
    }),
    zone() {
      return this.getStore(this.zoneId, 'zone');
    },
  },
  methods: {
    async putDice() {
      if (this.pickedDiceId) {
        await api.game
          .action({ name: 'replaceDice', data: { diceId: this.pickedDiceId, zoneId: this.zoneId } })
          .then(res => {
            if (!res.gameFinished) {
              // иначе может отработать уже после выхода в лобби, где нет игрового store
              this.$store.commit('setPickedDiceId', null);
              this.$store.commit('hideZonesAvailability');
            }
          })
          .catch(err => {
            prettyAlert(err.message);
          });
      }
    },
  },
  mounted() {
    // console.log('planeZone mounted', this.zone);
  },
};
</script>

<style scoped>
.zone {
  position: absolute;
  height: 73px;
  width: 142px;
  border: 2px solid yellow;
  white-space: pre;
  background: url(../../assets/clear-black-back.png);
  background: black;
}
.zone.vertical {
  height: 142px;
  width: 73px;
}
.zone > .wraper {
  position: relative;
  height: 100%;
  width: 100%;
}
.zone > .wraper > .domino-dice {
  position: absolute;
  top: 0px;
  left: 0px;
}
.zone.available {
  box-shadow: inset 0 0 20px 8px lightgreen;
}
.zone.available.hard {
  box-shadow: inset 0 0 20px 8px yellow;
}
</style>
