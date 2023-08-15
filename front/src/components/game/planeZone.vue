<template>
  <div
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
import { inject } from 'vue';
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
  setup() {
    return inject('gameGlobals');
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore();
    },
    game() {
      return this.getGame();
    },
    zone() {
      return {
        ...(this.store.zone?.[this.zoneId] || {}),
        available: this.zoneAvailable(this.zoneId),
      };
    },
  },
  methods: {
    async putDice() {
      if (this.gameState.pickedDiceId) {
        await this.handleGameApi(
          { name: 'replaceDice', data: { diceId: this.gameState.pickedDiceId, zoneId: this.zoneId } },
          {
            onSuccess: (res) => {
              this.gameState.pickedDiceId = '';
              this.hideZonesAvailability();
            },
          }
        );
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
