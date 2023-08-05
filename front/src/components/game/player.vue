<template>
  <div v-if="player._id" :class="['player', ...customClass, iam ? 'iam' : '', player.active ? 'active' : '']">
    <div class="inner-content">
      <div class="player-hands">
        <div v-if="hasPlaneInHand" class="hand-planes">
          <plane v-for="id in planeInHandIds" :key="id" :planeId="id" :inHand="true" />
        </div>
        <div v-if="!hasPlaneInHand" class="hand-dices-list">
          <div v-for="deck in dominoDecks" :key="deck._id" class="hand-dices-list-content">
            <div
              v-if="iam || showDecks || !state.isPortrait"
              class="hand-dices"
              :style="
                iam || (state.isMobile && state.isPortrait)
                  ? {
                      position: 'absolute',
                      right: '0px',
                      bottom: '0px',
                      height: '0px',
                      width: 'auto',
                      transformOrigin: 'right bottom',
                    }
                  : {
                      position: 'absolute',
                      left: '0px',
                      bottom: '0px',
                      height: '0px',
                      width: 'auto',
                      transformOrigin: 'left bottom',
                    }
              "
            >
              <dice v-for="id in Object.keys(deck.itemMap)" :key="id" :diceId="id" :inHand="true" :iam="iam" />
              <card v-if="iam && deck.subtype === 'teamlead'" :cardData="{ name: 'teamlead' }" />
              <card v-if="iam && deck.subtype === 'flowstate'" :cardData="{ name: 'flowstate' }" />
            </div>
          </div>
        </div>
        <div v-if="iam && !hasPlaneInHand" class="hand-cards-list">
          <div v-for="deck in cardDecks" :key="deck._id" class="hand-cards">
            <card
              v-for="id in Object.keys(deck.itemMap)"
              :key="id"
              :cardId="id"
              :canPlay="iam"
              :isSelected="id === gameState.selectedCard"
            />
          </div>
        </div>
      </div>
      <div class="workers">
        <card-worker :playerId="playerId" :iam="iam" :showControls="showControls" />
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';

import plane from './plane.vue';
import dice from './dice.vue';
import card from './card.vue';
import cardWorker from './cardWorker.vue';

export default {
  components: {
    plane,
    dice,
    card,
    cardWorker,
  },
  props: {
    customClass: Array,
    playerId: String,
    iam: Boolean,
    showControls: Boolean,
  },
  data() {
    return {};
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
    player() {
      return this.store.player?.[this.playerId];
    },
    dominoDecks() {
      return (
        this.deckIds.map((id) => this.store.deck?.[id] || {}).filter((deck) => deck.type === 'domino') || []
      ).sort(({ subtype }) => (subtype ? -1 : 1));
    },
    cardDecks() {
      return this.deckIds.map((id) => this.store.deck?.[id]).filter((deck) => deck.type === 'card') || [];
    },
    deckIds() {
      return Object.keys(this.player.deckMap || {});
    },
    planeInHandIds() {
      return Object.keys(
        this.deckIds.map((id) => this.store.deck?.[id]).find((deck) => deck.type === 'plane')?.itemMap || {}
      );
    },
    hasPlaneInHand() {
      return this.planeInHandIds.length > 0;
    },
    showDecks() {
      return this.sessionPlayerIsActive() && this.player.activeEvent?.showDecks;
    },
  },
  methods: {},
  mounted() {
    // console.log("player mounted", this.player);
  },
};
</script>

<style scoped>
.player:not(.iam) {
  position: relative;
  margin-top: 10px;
}
.player:not(.iam) > .inner-content {
  display: flex;
  align-items: flex-end;
  flex-direction: row-reverse;
}
#game.mobile-view.portrait-view .player:not(.iam) > .inner-content {
  flex-direction: row;
}

.player.iam > .inner-content {
  display: flex;
  align-items: flex-end;
  position: absolute;
  right: 0px;
  bottom: 0px;
  height: 0px;
}
#game.mobile-view .player.iam > .inner-content > .player-hands {
  flex-wrap: nowrap;
}
#game.mobile-view .player.iam > .hand-planes {
  transform: scale(0.5);
  width: 200%;
  height: 50%;
  transform-origin: top;
  left: -50%;
  bottom: -25%;
}

.workers {
  z-index: 1; /* карточка воркера должна быть видна при размещении игровых зон из руки */
}

.player-hands {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  padding: 0px 10px;
  flex-direction: row;
  position: relative;
  height: 0px;
  width: 100%;
}
#game.mobile-view.portrait-view .player-hands {
  justify-content: flex-start;
  height: initial;
}

.hand-cards-list {
  width: auto;
}
.hand-cards {
  display: flex;
  flex-wrap: wrap;
}
.hand-cards > .card-event {
  margin-top: -130px;
}

.hand-dices-list {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  height: auto;
  width: auto;
}
.hand-dices-list > .hand-dices-list-content {
  width: 0px;
  height: 150px;
  position: relative;
}
.hand-dices {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-end;
  align-items: flex-end;
  width: 100%;
  padding: 0px;
  width: 0px;
}
.hand-dices .domino-dice {
  height: 140px;
  width: 70px;
}
.hand-dices .card-event {
  scale: 0.7;
  transform-origin: bottom;
}
#game.mobile-view.portrait-view .hand-dices .card-event {
  display: none;
}

.hand-planes {
  display: flex;
  justify-content: center;
  align-items: center;
}
#game.mobile-view.portrait-view .hand-planes {
  flex-wrap: wrap;
  align-items: flex-end;
}
.player.iam .hand-planes {
  height: 0px;
  width: 100%;
  margin-bottom: 150px;
}
#game.mobile-view.portrait-view .player.iam .hand-planes {
  height: initial;
  margin-bottom: 0px;
}
.hand-planes .plane {
  position: relative;
}
.player.iam .hand-planes .plane:hover {
  cursor: pointer;
  opacity: 0.7;
}

.deck-counters {
  position: absolute;
  color: white;
  font-size: 24px;
  width: 100%;
  right: 0px;
  bottom: 0px;
  text-align: right;
}
.deck-counters b {
  font-size: 42px;
}
</style>
