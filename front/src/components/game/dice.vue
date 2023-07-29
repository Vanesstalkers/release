<template>
  <div
    :code="dice.code"
    :class="[
      'domino-dice',
      dice.deleted ? 'deleted' : '',
      locked ? 'locked' : '',
      activeEvent ? 'active-event' : '',
      hide ? 'hide' : '',
    ]"
    v-on:click="(e) => (activeEvent ? chooseDice() : pickDice())"
  >
    <div v-if="!locked" class="controls">
      <div :class="['scroll-off', 'control rotate', dice.deleted ? 'hidden' : '']" v-on:click.stop="rotateDice">
        <font-awesome-icon :icon="['fas', 'rotate']" size="2xl" style="color: #f4e205" />
      </div>
      <div :class="['scroll-off', 'control', 'fake-rotate', 'disabled', dice.deleted ? 'hidden' : '']" v-on:click.stop>
        <font-awesome-icon :icon="['fas', 'rotate']" size="2xl" style="color: #ccc" />
      </div>
      <div :class="['scroll-off', 'control', 'disabled', replaceAllowed || dice.deleted ? 'hidden' : '']">
        <font-awesome-icon :icon="['fass', 'trash']" size="2xl" style="color: #ccc" />
      </div>
      <div
        :class="['scroll-off', 'control', replaceAllowed && !dice.deleted ? '' : 'hidden']"
        v-on:click.stop="deleteDice"
      >
        <font-awesome-icon :icon="['fass', 'trash']" size="2xl" style="color: #f4e205" />
      </div>
      <div
        :class="['scroll-off', 'control', replaceAllowed && dice.deleted ? '' : 'hidden']"
        v-on:click.stop="restoreDice"
      >
        <font-awesome-icon :icon="['fas', 'trash-arrow-up']" size="2xl" style="color: #f4e205" />
      </div>
    </div>
    <template v-for="side in sideList">
      <div
        :id="side._id"
        :key="side._id"
        :value="side.value"
        :class="['el', side.activeEvent ? 'active-event' : '', side.eventData.fakeValue ? 'fake-value' : '']"
        v-on:click="(e) => (side.activeEvent ? (e.stopPropagation(), openDiceSideValueSelect(side._id)) : null)"
      >
        <dice-side-value-select
          v-if="gameState.selectedDiceSideId === side._id"
          v-on:select="pickActiveEventDiceSide"
        />
      </div>
    </template>
  </div>
</template>

<script>
import { inject } from 'vue';
import diceSideValueSelect from './diceSideValueSelect.vue';

export default {
  components: {
    diceSideValueSelect,
  },
  props: {
    diceId: String,
    inHand: Boolean,
    iam: Boolean,
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
    dice() {
      return this.store.dice?.[this.diceId];
    },
    sideList() {
      const sideList = this.dice.sideList || [{}, {}];
      return sideList.map(({ _id }) => {
        const side = this.store.diceside?.[_id];
        return side?._id ? side : { eventData: {} };
      });
    },
    locked() {
      return this.dice.locked || this.actionsDisabled();
    },
    activeEvent() {
      return this.sessionPlayerIsActive() && this.dice.activeEvent;
    },
    hide() {
      return this.inHand && !this.iam && !this.dice.visible;
    },
    replaceAllowed() {
      return this.dice.placedAtRound !== this.currentRound();
    },
  },
  methods: {
    async chooseDice() {
      await this.handleGameApi({
        name: 'eventTrigger',
        data: {
          eventData: {
            targetId: this.diceId,
            targetPlayerId: this.$parent.playerId,
          },
        },
      });
    },
    openDiceSideValueSelect(targetId) {
      this.gameState.selectedDiceSideId = targetId;
    },
    async pickActiveEventDiceSide(fakeValue) {
      await this.handleGameApi({
        name: 'eventTrigger',
        data: { eventData: { targetId: this.gameState.selectedDiceSideId, fakeValue } },
      });
      this.gameState.selectedDiceSideId = '';
    },
    async pickDice() {
      if (!this.iam) return;
      if (this.locked) return;
      this.gameState.pickedDiceId = this.diceId;
      this.hideZonesAvailability();
      await this.handleGameApi({ name: 'getZonesAvailability', data: { diceId: this.diceId } });
    },
    async rotateDice() {
      await this.handleGameApi({ name: 'rotateDice', data: { diceId: this.diceId } });
    },
    async deleteDice() {
      await this.handleGameApi({ name: 'deleteDice', data: { diceId: this.diceId } });
    },
    async restoreDice() {
      await this.handleGameApi({ name: 'restoreDice', data: { diceId: this.diceId } });
    },
  },
};
</script>

<style scoped>
.domino-dice {
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
.domino-dice.deleted {
  transform: scale(0.5);
}
.domino-dice.hide > .el {
  background-image: none;
  background: black;
}

.plane .domino-dice,
.player.iam .hand-dices .domino-dice {
  cursor: pointer;
}
.domino-dice.locked {
  opacity: 0.5;
  cursor: not-allowed !important;
}

.domino-dice > .controls {
  display: none;
  position: absolute;
  width: 100%;
  height: 100%;
  background: darkgrey;
  opacity: 0.9;
  color: white;
  z-index: 1;
  border-radius: 16px;
}
.zone.vertical .domino-dice > .controls {
  flex-wrap: wrap;
}
.zone.vertical .domino-dice > .controls > .control {
  height: 33.333%;
}

.plane .domino-dice:hover:not(.active-event) > .controls,
.bridge .domino-dice:hover:not(.active-event) > .controls {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.domino-dice > .controls > .control {
  width: 100%;
  height: 100%;
}
.domino-dice > .controls > .control > svg {
  width: 50%;
  height: 100%;
}
.domino-dice > .controls > .control:not(.disabled):hover > svg {
  cursor: pointer;
  color: white !important;
}

.rotate180 .domino-dice > .controls {
  transform: rotate(180deg);
}
.rotate90 .domino-dice > .controls > .control {
  transform: rotate(270deg);
}
.rotate270 .domino-dice > .controls > .control {
  transform: rotate(90deg);
}

.domino-dice > .controls > .control.disabled {
  cursor: not-allowed;
}
.domino-dice > .controls > .control.fake-rotate,
.domino-dice > .controls > .control.hidden {
  display: none;
}
.bridge .domino-dice > .controls > .control.fake-rotate:not(.hidden) {
  display: block;
}
.bridge .domino-dice > .controls > .control.rotate {
  display: none;
}

.domino-dice > .el {
  position: relative;
  flex-shrink: 0;
  float: left;
  width: 70px;
  height: 70px;
  border-radius: 15px;
  background-image: url(../../assets/Dices.png);
}
.player.iam .hand-dices .domino-dice:not(.locked):hover > .el {
  box-shadow: inset 0 0 20px 8px lightgreen;
}
.domino-dice > .el.active-event:hover {
  box-shadow: inset 0 0 20px 8px lightgreen !important;
}

.domino-dice.active-event {
  box-shadow: none !important;
}
.domino-dice.active-event > .el {
  box-shadow: inset 0 0 20px 8px yellow;
}
.domino-dice.active-event:hover > .el {
  opacity: 0.7;
}

.domino-dice > .el.fake-value {
  box-shadow: inset 0 0 20px 8px orange;
}
.domino-dice > .el {
  background-position: -497px;
}
.domino-dice > .el[value='0'] {
  background-position: -0px;
}
.domino-dice > .el[value='1'] {
  background-position: -71px;
}
.domino-dice > .el[value='2'] {
  background-position: -142px;
}
.domino-dice > .el[value='3'] {
  background-position: -213px;
}
.domino-dice > .el[value='4'] {
  background-position: -284px;
}
.domino-dice > .el[value='5'] {
  background-position: -355px;
}
.domino-dice > .el[value='6'] {
  background-position: -426px;
}
</style>
