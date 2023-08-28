<template>
  <div
    v-if="gameDataLoaded"
    id="game"
    :class="[state.isMobile ? 'mobile-view' : '', state.isLandscape ? 'landscape-view' : 'portrait-view']"
    @wheel.prevent="zoomGamePlane"
  >
    <tutorial :inGame="true" class="scroll-off" />

    <GUIWrapper
      :pos="['top', 'left']"
      :offset="{ left: state.isMobile ? 60 : [60, 80, 110, 130, 160, 190][state.guiScale] }"
      :contentClass="['gui-small']"
      :wrapperStyle="{ zIndex: 1 }"
    >
      <div style="display: flex">
        <div class="chat gui-btn" v-on:click="showChat = !showChat" />
        <div class="log gui-btn" v-on:click="toggleLog" />
        <div class="move gui-btn" v-on:click="showMoveControls = !showMoveControls" />
      </div>
      <div v-if="showMoveControls" class="gameplane-controls">
        <div class="zoom-minus" v-on:click="zoomGamePlane({ deltaY: 1 })" />
        <div class="move-top" v-on:click="gamePlaneTranslateY -= 100" />
        <div class="zoom-plus" v-on:click="zoomGamePlane({ deltaY: -1 })" />
        <div class="move-left" v-on:click="gamePlaneTranslateX -= 100" />
        <div
          class="reset"
          v-on:click="
            gamePlaneRotation = 0;
            gamePlaneTranslateX = 0;
            gamePlaneTranslateY = 0;
            updatePlaneScale();
          "
        />
        <div class="move-right" v-on:click="gamePlaneTranslateX += 100" />
        <div class="rotate-right" v-on:click="gamePlaneRotation += 15" />
        <div class="move-bottom" v-on:click="gamePlaneTranslateY += 100" />
        <div class="rotate-left" v-on:click="gamePlaneRotation -= 15" />
      </div>
    </GUIWrapper>

    <div v-if="showChat" class="chat-content scroll-off">
      <chat
        :channels="{
          [`game-${gameState.gameId}`]: {
            name: 'Игровой чат',
            users: chatUsers,
            items: game.chat,
            inGame: true,
          },
          [`lobby-${state.currentLobby}`]: {
            name: 'Общий чат',
            users: this.lobby.users || {},
            items: this.lobby.chat || {},
          },
        }"
        :defActiveChannel="`game-${gameState.gameId}`"
        :userData="userData"
      />
    </div>

    <div v-if="showLog" class="log-content scroll-off">
      <div v-for="[id, logItem] in Object.entries(logs).reverse()" :key="id" class="log-item">
        [ {{ new Date(logItem.time).toTimeString().split(' ')[0] }} ]:
        {{ logItem.msg }}
      </div>
    </div>

    <div v-if="state.shownCard" class="shown-card scroll-off" v-on:click.stop="closeCardInfo">
      <div class="close" v-on:click.stop="closeCardInfo" />
      <div class="img" :style="{ backgroundImage: `url(/img/cards/release/${state.shownCard}.jpg)` }" />
    </div>

    <div
      id="gamePlane"
      :style="{ ...gamePlaneCustomStyleData, opacity: 1, transformOrigin: 'left top', ...gamePlaneControlStyle }"
    >
      <plane v-for="id in Object.keys(game.planeMap)" :key="id" :planeId="id" :gamePlaneScale="gamePlaneScale" />
      <!-- bridgeMap может не быть на старте игры при формировании поля с нуля -->
      <bridge v-for="id in Object.keys(game.bridgeMap || {})" :key="id" :bridgeId="id" />

      <div
        v-for="position in possibleAddPlanePositions"
        :key="position.joinPortId + position.joinPortDirect + position.targetPortId + position.targetPortDirect"
        :joinPortId="position.joinPortId"
        :joinPortDirect="position.joinPortDirect"
        :targetPortId="position.targetPortId"
        :targetPortDirect="position.targetPortDirect"
        :style="position.style"
        class="fake-plane"
        v-on:click="putPlaneOnField"
      />
    </div>

    <GUIWrapper :pos="['top', 'right']" :wrapperClass="['game-info']">
      <div class="wrapper">
        <div class="game-status-label">{{ statusLabel }}</div>
        <div v-for="deck in deckList" :key="deck._id" class="deck" :code="deck.code">
          <div v-if="deck._id && deck.code === 'Deck[domino]'" class="hat" v-on:click="takeDice">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card]'" class="card-event" v-on:click="takeCard">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_drop]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_active]'" class="deck-active">
            <!-- активная карта всегда первая - для верстки она должна стать последней -->
            <card v-for="id in sortActiveCards(Object.keys(deck.itemMap))" :key="id" :cardId="id" :canPlay="true" />
          </div>
        </div>
      </div>
    </GUIWrapper>

    <GUIWrapper :pos="['bottom', 'right']" :wrapperClass="['session-player']">
      <player
        :playerId="gameState.sessionPlayerId"
        :customClass="[`scale-${state.guiScale}`]"
        :iam="true"
        :showControls="showPlayerControls"
      />
    </GUIWrapper>
    <GUIWrapper
      :pos="state.isMobile && state.isPortrait ? ['bottom', 'right'] : ['bottom', 'left']"
      :offset="
        state.isMobile && state.isPortrait
          ? { bottom: 10 + 10 + 180 * 0.6 + ((sessionUserCardDeckLength || 1) - 1) * 20 }
          : {}
      "
      :wrapperClass="['players']"
      :contentClass="['gui-small']"
    >
      <player
        v-for="(id, index) in playerIds"
        :key="id"
        :playerId="id"
        :customClass="[`idx-${index}`]"
        :showControls="false"
      />
    </GUIWrapper>
  </div>
</template>

<script>
import { reactive, provide } from 'vue';
import { addEvents, removeEvents } from '../../lib/gameEvents';
import { config as gamePlaneConfig, addMouseEvents, removeMouseEvents } from '../../lib/gameMouseEvents';
import {} from '../components/game/utils';

import GUIWrapper from '../components/gui-wrapper.vue';
import tutorial from '~/lib/helper/front/helper.vue';
import chat from '~/lib/chat/front/chat.vue';
import player from '../components/game/player.vue';
import plane from '../components/game/plane.vue';
import bridge from '../components/game/bridge.vue';
import card from '../components/game/card.vue';

export default {
  components: {
    GUIWrapper,
    tutorial,
    chat,
    player,
    plane,
    bridge,
    card,
  },
  data() {
    return {
      showChat: false,
      showLog: false,
      showMoveControls: false,

      gamePlaneCustomStyleData: {},
      gamePlaneScale: 1,
      gamePlaneScaleMin: 0.3,
      gamePlaneScaleMax: 1,
      gamePlaneTranslateX: 0,
      gamePlaneTranslateY: 0,
      gamePlaneRotation: 0,
    };
  },
  setup: function () {
    const gameState = reactive({
      gameId: '',
      sessionPlayerId: '',
      pickedDiceId: '',
      selectedDiceSideId: '',
      shownCard: '',
      selectedCard: '',
    });

    async function handleGameApi(data, { onSuccess, onError } = {}) {
      if (!onError) onError = prettyAlert;
      await api.action
        .call({ path: 'lib.game.api.action', args: [data] })
        .then(onSuccess)
        .catch(onError);
    }
    function getGame() {
      return this.$root.state.store.game?.[gameState.gameId] || {};
    }
    function getStore() {
      return this.getGame().store || {};
    }
    function sessionPlayerIsActive() {
      return (
        gameState.sessionPlayerId ===
        Object.keys(this.getGame().playerMap || {}).find((id) => this.getStore().player?.[id]?.active)
      );
    }
    provide('gameGlobals', {
      handleGameApi,
      getGame,
      getStore,
      gameState,
      currentRound() {
        return this.game?.round;
      },
      sessionPlayerIsActive,
      actionsDisabled() {
        return this.store.player?.[gameState.sessionPlayerId]?.eventData?.actionsDisabled;
      },
      zoneAvailable(zoneId) {
        return (this.getStore().player?.[gameState.sessionPlayerId]?.availableZones || []).includes(zoneId);
      },
      hideZonesAvailability() {
        this.getStore().player[gameState.sessionPlayerId].availableZones = [];
      },
    });

    return { handleGameApi, getGame, getStore, gameState, gamePlaneConfig, sessionPlayerIsActive };
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore() || {};
    },
    gamePlaneControlStyle() {
      const transform = [];
      transform.push('translate(' + this.gamePlaneTranslateX + 'px, ' + this.gamePlaneTranslateY + 'px)');
      transform.push(`rotate(${this.gamePlaneRotation}deg)`);
      return { transform: transform.join(' '), scale: this.gamePlaneScale };
    },
    game() {
      return this.getGame();
    },
    gameDataLoaded() {
      return this.game.addTime;
    },
    userData() {
      return this.state.store?.user?.[this.state.currentUser] || {};
    },
    lobby() {
      return this.state.store.lobby?.[this.state.currentLobby] || {};
    },
    chatUsers() {
      return Object.values(this.store.player).reduce((obj, player) => {
        const user = this.lobby.users?.[player.userId];
        return Object.assign(obj, { [player.userId]: user });
      }, {});
    },
    logs() {
      return this.game.logs || {};
    },
    statusLabel() {
      switch (this.game.status) {
        case 'WAIT_FOR_PLAYERS':
          return 'Ожидание игроков';
        case 'PREPARE_START':
          return 'Создание игрового поля';
        case 'IN_PROCESS':
          return 'Раунд ' + this.game.round;
        case 'FINISHED':
          return 'Игра закончена';
      }
    },
    showPlayerControls() {
      return this.game.status === 'IN_PROCESS';
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
    },
    sessionPlayer() {
      return this.store.player?.[this.gameState.sessionPlayerId] || {};
    },
    sessionUserCardDeckLength() {
      return (
        Object.keys(
          Object.keys(this.sessionPlayer.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'card' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },
    helper() {
      return this.sessionPlayer?.helper;
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
    activeCards() {
      return this.deckList.find((deck) => deck.subtype === 'active') || {};
    },
    possibleAddPlanePositions() {
      if (!this.sessionPlayerIsActive()) return [];
      return (this.game.availablePorts || []).map(
        ({ joinPortId, joinPortDirect, targetPortId, targetPortDirect, position }) => {
          return {
            joinPortId,
            joinPortDirect,
            targetPortId,
            targetPortDirect,
            style: {
              left: position.left + 'px',
              top: position.top + 'px',
              width: position.right - position.left + 'px',
              height: position.bottom - position.top + 'px',
            },
          };
        }
      );
    },
  },
  watch: {
    gameDataLoaded: function () {
      this.$set(this.$root.state, 'viewLoaded', true);
    },
    'game.round': function () {
      this.$set(this.$root.state, 'selectedDiceSideId', '');
    },
    'state.isLandscape': function () {
      this.updatePlaneScale();
    },
    'game.availablePorts': function (newValue, oldValue) {
      if (newValue?.length > 0 || oldValue?.length > 0) this.updatePlaneScale();
    },
  },
  methods: {
    sortActiveCards(arr) {
      return arr
        .map((id) => this.store.card?.[id] || {})
        .sort((a, b) => (a.played > b.played ? 1 : -1)) // сортируем по времени сыгрывания
        .sort((a, b) => (a.played ? 0 : 1)) // переносим не сыгранные в конец
        .map((card) => card._id);
    },
    async takeDice() {
      // return;
      await this.handleGameApi({ name: 'takeDice', data: { count: 3 } });
    },
    async takeCard() {
      // return;
      await this.handleGameApi({ name: 'takeCard', data: { count: 5 } });
    },
    async putPlaneOnField(event) {
      await this.handleGameApi({
        name: 'putPlaneOnField',
        data: {
          gameId: this.gameState.gameId,
          joinPortId: event.target.attributes.joinPortId.value,
          targetPortId: event.target.attributes.targetPortId.value,
          joinPortDirect: event.target.attributes.joinPortDirect.value,
          targetPortDirect: event.target.attributes.targetPortDirect.value,
        },
      });
    },
    updatePlaneScale() {
      if (this.$el instanceof HTMLElement) {
        const { innerWidth, innerHeight } = window;

        const gamePlaneRotation = this.gamePlaneRotation;
        const gamePlaneTranslateX = this.gamePlaneTranslateX;
        const gamePlaneTranslateY = this.gamePlaneTranslateY;
        this.gamePlaneRotation = 0;
        this.gamePlaneTranslateX = 0;
        this.gamePlaneTranslateY = 0;
        const restoreGamePlaneSettings = () => {
          this.gamePlaneRotation = gamePlaneRotation;
          this.gamePlaneTranslateX = gamePlaneTranslateX;
          this.gamePlaneTranslateY = gamePlaneTranslateY;
        };

        let { width, height } = this.$el.querySelector('#gamePlane').getBoundingClientRect();
        width = width / this.gamePlaneScale;
        height = height / this.gamePlaneScale;
        const value = Math.min(innerWidth / width, innerHeight / height);
        if (value > 0) {
          this.gamePlaneScale = value * 0.75;
          if (this.gamePlaneScaleMin > value) this.gamePlaneScaleMin = value;
          if (this.gamePlaneScaleMax < value) this.gamePlaneScaleMax = value;
          this.$nextTick(() => {
            const p = {};
            const gamePlane = document.getElementById('gamePlane');
            if (gamePlane instanceof HTMLElement) {
              const gamePlaneRect = gamePlane.getBoundingClientRect();

              gamePlane.querySelectorAll('.plane, .fake-plane').forEach((plane) => {
                const rect = plane.getBoundingClientRect();
                const offsetTop = rect.top - gamePlaneRect.top;
                const offsetLeft = rect.left - gamePlaneRect.left;

                if (p.t == undefined || rect.top < p.t) p.t = rect.top;
                if (p.b == undefined || rect.bottom > p.b) p.b = rect.bottom;
                if (p.l == undefined || rect.left < p.l) p.l = rect.left;
                if (p.r == undefined || rect.right > p.r) p.r = rect.right;

                if (p.ot == undefined || offsetTop < p.ot) p.ot = offsetTop;
                if (p.ol == undefined || offsetLeft < p.ol) p.ol = offsetLeft;
              });

              const planePadding = 300;
              this.gamePlaneCustomStyleData = {
                height: planePadding + (p.b - p.t) / this.gamePlaneScale + 'px',
                width: planePadding + (p.r - p.l) / this.gamePlaneScale + 'px',
                top: 'calc(50% - ' + ((p.b - p.t) / 2 + p.ot * 1) + 'px)',
                left: `calc(${this.state.isMobile ? '65%' : '50%'} - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
              };

              restoreGamePlaneSettings();
            }
          });
        }
      }
    },

    zoomGamePlane(event) {
      this.gamePlaneScale += event.deltaY > 0 ? -0.1 : 0.1;
      if (this.gamePlaneScale < this.gamePlaneScaleMin) this.gamePlaneScale = this.gamePlaneScaleMin;
      if (this.gamePlaneScale > this.gamePlaneScaleMax) this.gamePlaneScale = this.gamePlaneScaleMax;
    },
    closeCardInfo() {
      this.$set(this.$root.state, 'shownCard', '');
    },
    async toggleLog() {
      if (this.showLog) return (this.showLog = false);
      await api.action
        .call({ path: 'lib.game.api.showLogs', args: [{ lastItemTime: Object.values(this.logs).pop()?.time }] })
        .then(() => {
          this.showLog = true;
        })
        .catch(prettyAlert);
    },
    async callGameEnter() {
      // без этого не смогу записать gameId и playerId в context сессии
      await api.action
        .call({
          path: 'lib.game.api.enter',
          args: [{ gameId: this.$route.params.id }],
        })
        .then((data) => {
          this.gameState.gameId = data.gameId;
          this.gameState.sessionPlayerId = data.playerId;
        })
        .catch((err) => {
          prettyAlert(err);
          this.$router.push({ path: `/` }).catch((err) => {
            console.log(err);
          });
        });

      addEvents(this);
      addMouseEvents(this);
    },
  },
  async created() {},
  async mounted() {
    if (!this.state.currentLobby) {
      this.$router.push({ path: `/` }).catch((err) => {
        console.log(err);
      });
    } else if (this.state.currentUser) {
      this.callGameEnter();
    } else {
      this.$root.initSession({
        success: this.callGameEnter,
      });
    }
  },
  async beforeDestroy() {
    this.$set(this.$root.state, 'viewLoaded', false);

    removeEvents();
    removeMouseEvents();
    if (this.$root.state.store.game?.[this.gameState.gameId]) {
      delete this.$root.state.store.game[this.gameState.gameId];
    }
  },
};
</script>

<style>
#game {
  height: 100%;
  width: 100%;
}
#game.mobile-view {
  touch-action: none;
}
#game .active-event {
  cursor: pointer;
  box-shadow: inset 0 0 20px 8px yellow;
}

#gamePlane {
  position: relative;
  width: 100%;
  height: 100%;
}
#game.mobile-view #gamePlane {
  margin-left: -50px;
}
#game.mobile-view.landscape-view #gamePlane {
  margin-left: -100px;
}

.gui-resizeable.scale-1 {
  scale: 0.8;
}
.gui-resizeable.scale-2 {
  scale: 1;
}
.gui-resizeable.scale-3 {
  scale: 1.5;
}
.gui-resizeable.scale-4 {
  scale: 2;
}
.gui-resizeable.scale-5 {
  scale: 2.5;
}
#game.mobile-view .gui-resizeable.scale-1 {
  scale: 0.6;
}
#game.mobile-view .gui-resizeable.scale-2 {
  scale: 0.8;
}
#game.mobile-view .gui-resizeable.scale-3 {
  scale: 1;
}
#game.mobile-view .gui-resizeable.scale-4 {
  scale: 1.2;
}
#game.mobile-view .gui-resizeable.scale-5 {
  scale: 1.5;
}
.gui-resizeable.gui-small.scale-1 {
  scale: 0.6;
}
.gui-resizeable.gui-small.scale-2 {
  scale: 0.8;
}
.gui-resizeable.gui-small.scale-3 {
  scale: 1;
}
.gui-resizeable.gui-small.scale-4 {
  scale: 1.2;
}
.gui-resizeable.gui-small.scale-5 {
  scale: 1.5;
}
#game.mobile-view .gui-resizeable.gui-small.scale-1 {
  scale: 0.4;
}
#game.mobile-view .gui-resizeable.gui-small.scale-2 {
  scale: 0.6;
}
#game.mobile-view .gui-resizeable.gui-small.scale-3 {
  scale: 0.8;
}
#game.mobile-view .gui-resizeable.gui-small.scale-4 {
  scale: 1;
}
#game.mobile-view .gui-resizeable.gui-small.scale-5 {
  scale: 1.2;
}

.deck > .card-event {
  width: 60px;
  height: 90px;
  color: white;
  border: none;
  font-size: 36px;
  display: flex;
  justify-content: center;
  align-content: center;
}

.deck[code='Deck[domino]'] {
  position: absolute;
  top: 35px;
  right: 100px;
  background: url(../assets/hat.png);
  background-size: cover;
  padding: 20px;
  cursor: default;
}
.deck[code='Deck[domino]'] > .hat {
  color: white;
  font-size: 36px;
  padding: 4px;
  border-radius: 50%;
  box-shadow: inset 0px 0px 20px 0px black;
}

.deck[code='Deck[card]'] {
  position: absolute;
  top: 35px;
  right: 30px;
  cursor: default;
}

.deck[code='Deck[card_drop]'] {
  position: absolute;
  filter: grayscale(1);
  transform: scale(0.5);
  top: 65px;
  right: 0px;
  cursor: default;
}

.deck[code='Deck[card_active]'] {
  position: absolute;
  top: 140px;
  right: 0px;
  display: flex;
}
.deck[code='Deck[card_active]'] .card-event:not(:first-child) {
  margin-top: -135px;
}
.deck-active {
  display: flex;
  flex-direction: column;
}

.game-status-label {
  text-align: right;
  color: white;
  font-weight: bold;
  font-size: 2em;
  white-space: nowrap;
  text-shadow: black 1px 0 10px;
}
#game.mobile-view .game-status-label {
  font-size: 1.5em;
}

.plane {
  position: absolute;
  transform-origin: 0 0;
}
.plane.card-event {
  display: block;
}
.plane.card-event.card-event-req_legal {
  background-image: url(../../public/img/cards/release/req_legal.jpg);
}
.plane.card-event.card-event-req_tax {
  background-image: url(../../public/img/cards/release/req_tax.jpg);
}
.fake-plane {
  position: absolute;
  background: red;
  border: 1px solid;
  opacity: 0.5;
}
.fake-plane:hover {
  opacity: 0.8;
  z-index: 1;
}
.shown-card {
  position: fixed !important;
  z-index: 9999;
  width: 100%;
  height: 100%;
  top: 0px;
  left: 0px;
  background-image: url(../assets/clear-grey-back.png);
}
.shown-card > .img {
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 100%;
}
.shown-card > .close {
  background-image: url(../assets/close.png);
  background-color: black;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  width: 50px;
  height: 50px;
  border-radius: 10px;
}
.shown-card > .close:hover {
  opacity: 0.7;
}

.gameplane-controls {
  height: 200px;
  width: 200px;
  margin: 20px;
  padding: 5px;
  border: 8px solid #f4e205;
  border-radius: 50%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
}
.gameplane-controls > div {
  width: 30%;
  height: 30%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 70%;
  background-color: #f4e205;
  box-shadow: 5px 5px 5px 0px #a69900;
  border-radius: 50%;
  cursor: pointer;
}
.gameplane-controls > div:hover {
  opacity: 0.5;
}
.gameplane-controls > .move-top {
  background-image: url(../assets/arrow-top.png);
}
.gameplane-controls > .move-bottom {
  background-image: url(../assets/arrow-bottom.png);
}
.gameplane-controls > .move-right {
  background-image: url(../assets/arrow-right.png);
}
.gameplane-controls > .move-left {
  background-image: url(../assets/arrow-left.png);
}
.gameplane-controls > .zoom-plus {
  background-image: url(../assets/zoom+.png);
}
.gameplane-controls > .zoom-minus {
  background-image: url(../assets/zoom-.png);
}
.gameplane-controls > .rotate-left {
  background-image: url(../assets/rotate-left.png);
}
.gameplane-controls > .rotate-right {
  background-image: url(../assets/rotate-right.png);
}
.gameplane-controls > .reset {
  background-color: grey;
  box-shadow: 5px 5px 5px 0px darkgrey;
  background-image: url(../assets/reset.png);
}
.gameplane-controls.tutorial-active {
  box-shadow: 0 0 40px 40px #fff;
  border-radius: 50%;
}

.gui-btn {
  width: 64px;
  height: 64px;
  border: 4px solid #f4e205;
  border-radius: 50%;
  background-color: #f4e205;
  background-size: 50px;
  background-repeat: no-repeat;
  background-position: center;
  margin: 10px;
  cursor: pointer;
}
.gui-btn:hover {
  opacity: 0.7;
}
.gui-btn.chat {
  background-image: url(../assets/chat.png);
}
.gui-btn.log {
  background-image: url(../assets/log.png);
}
.gui-btn.move {
  background-image: url(../assets/move.png);
}

.chat-content {
  z-index: 3;
  position: absolute;
  left: 40px;
  top: 60px;
  width: 300px;
  height: calc(100% - 100px);
  margin: 30px;
  background-image: url(../assets/clear-black-back.png);
  border: 2px solid #f4e205;
  color: #f4e205;
}

.log-content {
  position: fixed;
  left: 40px;
  top: 60px;
  z-index: 2;
  width: calc(100% - 100px);
  height: calc(100% - 100px);
  margin: 30px;
  box-shadow: inset 0px 0px 2px 2px #f4e205;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAACFklEQVR4nO3TMREAIRDAwAP/0l7UG2DSQrGrIE3WzHwDHO3bAfAyg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAgEg0AwCASDQDAIBINAMAiEHzg6AlzqD8bjAAAAAElFTkSuQmCCCg==);
  color: #f4e205;
  overflow: auto;
  text-align: left;
}
.log-item {
  padding: 10px;
}
</style>
