<template>
  <div
    v-if="player._id"
    :id="player._id"
    :class="[
      'card-worker',
      'card-worker-' + player.code,
      player.active ? 'active' : '',
      choiceEnabled ? 'active-event' : '',
    ]"
    :style="customStyle"
  >
    <div v-if="showControls && iam && sessionPlayerIsActive()" v-on:click="endRound" class="end-round-btn">
      Закончить раунд
    </div>
    <div v-if="player.active && player.timerEndTime" class="end-round-timer">{{ this.localTimer }}</div>
    <div v-if="!iam" class="domino-dice">
      {{ dominoDeckCount }}
    </div>
    <div v-if="!iam" class="card-event">
      {{ cardDeckCount }}
    </div>
    <div v-if="showLeaveBtn && iam" v-on:click="leaveGame" class="leave-game-btn">Выйти из игры</div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  props: {
    playerId: String,
    iam: Boolean,
    showControls: Boolean,
  },
  data() {
    return {
      localTimer: null,
      localTimerUpdateTime: null,
      localTimerId: null,
    };
  },
  setup() {
    return inject('gameGlobals');
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    game() {
      return this.getGame();
    },
    store() {
      return this.getStore();
    },
    player() {
      const player = this.store.player?.[this.playerId] || {};
      // через watch не осилил (проблема при создании игры - "Vue cannot detect property addition or deletion")
      if (player.timerEndTime && this.localTimerUpdateTime !== player.timerUpdateTime) {
        clearTimeout(this.localTimerId);
        this.localTimer = Math.floor((player.timerEndTime - Date.now()) / 1000);
        this.localTimerUpdateTime = player.timerUpdateTime;
        this.localTimerId = setInterval(() => {
          if (this.localTimer !== null) {
            this.localTimer--;
            if (this.localTimer < 0) this.localTimer = 0;
          }
        }, 1000);
      }
      return player;
    },
    customStyle() {
      const style = {};
      // style.backgroundImage = `url(../../assets/cards/${this.card.name||'unknown'}.jpg)`;
      // style.backgroundImage = `url(../../assets/plane.png)`;
      return style;
    },
    choiceEnabled() {
      return this.sessionPlayerIsActive() && this.player.activeEvent?.choiceEnabled;
    },
    dominoDeckCount() {
      return (
        Object.keys(
          Object.keys(this.player.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'domino' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },
    cardDeckCount() {
      return (
        Object.keys(
          Object.keys(this.player.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'card' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },
    showLeaveBtn() {
      return this.game.status === 'finished';
    },
  },
  methods: {
    async endRound() {
      this.hideZonesAvailability();
      this.gameState.pickedDiceId = '';
      await api.game.action({ name: 'endRound' }).catch((err) => {
        prettyAlert(err.message);
      });
    },
    async leaveGame() {
      await api.action
        .call({
          path: 'lib.game.api.leave',
          args: [],
        })
        .catch((err) => {
          prettyAlert(err.message);
        });
    },
  },
  mounted() {},
};
</script>

<style scoped>
.card-worker {
  position: relative;
  border: 1px solid;
  width: 120px;
  height: 180px;
  background-size: cover;
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  border-radius: 10px;
  margin: 0px 0px 0px 5px;
  box-shadow: inset 0px 20px 20px 0px black;

  background-image: url(../../assets/workers/1.jpg);
}
.card-worker-1 {
  background-image: url(../../assets/workers/1.jpg);
}
.card-worker-2 {
  background-image: url(../../assets/workers/2.jpg);
}
.card-worker-3 {
  background-image: url(../../assets/workers/3.jpg);
}
.card-worker-4 {
  background-image: url(../../assets/workers/4.jpg);
}
.card-worker-5 {
  background-image: url(../../assets/workers/5.jpg);
}
.card-worker.active {
  outline: 4px solid green;
}

.card-worker .card-event {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 60px;
  height: 90px;
  color: white;
  border: none;
  font-size: 36px;
  display: flex;
  justify-content: center;
  align-content: center;
}
#game.mobile-view.portrait-view .card-worker .card-event {
  left: auto;
  right: 0px;
}
.card-worker .domino-dice {
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 40px;
  height: 70px;
  color: white;
  border: none;
  font-size: 36px;
  line-height: 70px;
  display: flex;
  justify-content: center;
  align-content: center;
  background-image: url(../../assets/dice.png);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  visibility: hidden;
}
#game.mobile-view.portrait-view .card-worker .domino-dice {
  visibility: visible;
}

.card-worker.active-event .end-round-btn,
.card-worker.active-event .end-round-timer {
  display: none;
}

.end-round-btn {
  position: absolute;
  bottom: 0px;
  width: 100px;
  font-size: 0.5em;
  border: 1px solid black;
  text-align: center;
  cursor: pointer;
  margin: 6px 10px;
  background: #3f51b5;
  color: white;
  font-size: 16px;
}
.end-round-timer {
  position: absolute;
  bottom: 50px;
  width: 100px;
  z-index: 1;
  font-size: 64px;
  color: white;
  border-radius: 50%;
  height: 100px;
  line-height: 100px;
  margin: 10px;
  color: #ff5900;
  text-shadow: 4px 4px 0 #fff;
}
.leave-game-btn {
  position: absolute;
  bottom: 0px;
  width: 100px;
  font-size: 0.5em;
  border: 1px solid black;
  text-align: center;
  cursor: pointer;
  margin: 6px 10px;
  background: #bb3030;
  color: white;
  font-size: 16px;
}
</style>
