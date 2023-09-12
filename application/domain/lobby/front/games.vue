<template>
  <div>
    <div class="new-game-controls">
      <div class="breadcrumbs">
        <span
          :class="['select-btn', deckType ? 'active selected' : 'wait-for-select']"
          @click="selectDeckType(null), selectGameType(null), selectGameConfig(null)"
        >
          {{ deckList[deckType] || 'Выбор колоды:' }}
        </span>
        <span
          v-if="deckType"
          :class="['select-btn', gameType ? 'active selected' : 'wait-for-select']"
          @click="selectGameType(null), selectGameConfig(null)"
        >
          {{ gameList[gameType] || 'Выбор типа игры:' }}
        </span>
        <span
          v-if="gameType"
          :class="['select-btn', gameConfig ? 'active selected' : 'wait-for-select']"
          @click="selectGameConfig(null)"
        >
          {{ gameConfig ? configList[gameConfig].title : 'Выбор режима:' }}
        </span>
      </div>
      <div v-if="!deckType" class="game-types">
        <div class="select-btn wait-for-select" @click="selectDeckType('release')">
          <font-awesome-icon :icon="['fas', 'microchip']" /> Релиз
        </div>
        <div class="select-btn wait-for-select disabled"><font-awesome-icon :icon="['fas', 'car']" />Авто</div>
        <div class="select-btn wait-for-select disabled"><font-awesome-icon :icon="['fas', 'money-bill']" />Банк</div>
      </div>
      <div v-if="deckType === 'release' && !gameType" class="release-game">
        <div class="select-btn wait-for-select" v-on:click="selectGameType('single-blitz')">
          <font-awesome-icon :icon="['fas', 'user']" size="2xl" />
          Фриланс
        </div>
        <div class="select-btn wait-for-select" v-on:click="selectGameType('duel-blitz')">
          <font-awesome-icon :icon="['fas', 'user-group']" size="2xl" />
          Дуэль
        </div>
        <div class="select-btn wait-for-select" v-on:click="selectGameType('ffa-blitz')">
          <font-awesome-icon :icon="['fas', 'users']" size="2xl" />
          Каждый за себя
        </div>
        <div class="select-btn disabled">
          <font-awesome-icon :icon="['fas', 'dice-four']" size="2xl" style="color: #fff" />
          Команды
        </div>
      </div>
      <div v-if="deckType === 'release' && gameType && !gameConfig" class="release-game-config">
        <div class="select-btn wait-for-select" v-on:click="selectGameConfig('blitz')">Блиц</div>
        <div class="select-btn wait-for-select" v-on:click="selectGameConfig('standart')">Стандарт</div>
        <div class="select-btn wait-for-select" v-on:click="selectGameConfig('hardcore')">Хардкор</div>
      </div>
      <div v-if="deckType === 'release' && gameType && gameConfig" class="release-game-start">
        <span class="timer">
          <font-awesome-icon :icon="['fas', 'plus']" @click="updateGameTimer(15)" />
          {{ gameTimer }}
          <font-awesome-icon :icon="['fas', 'minus']" @click="updateGameTimer(-15)" />
        </span>
        <span class="timer-label">секунд<br />на ход</span>
        <button class="select-btn active" @click="addGame()">Начать игру</button>
      </div>
    </div>
    <hr :style="{ margin: '10px 30px', borderColor: '#f4e205' }" />
    <div>
      <perfect-scrollbar>
        <div v-for="game in lobbyGameList" :key="game._id" class="game-item">
          Раунд: ( {{ game.round }} ) Игроков: ( {{ game.joinedPlayers }} )
          <span v-if="!game.waitForPlayer" :style="{ color: '#f4e205' }">
            <button class="lobby-btn join-btn" v-on:click="joinGame({ gameId: game.id, viewerMode: true })">
              <font-awesome-icon :icon="['fas', 'eye']" />
              Посмотреть
            </button></span
          >
          <button v-if="game.waitForPlayer" class="lobby-btn join-btn" v-on:click="joinGame({ gameId: game.id })">
            Присоединиться
          </button>
        </div>
      </perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

export default {
  components: {
    PerfectScrollbar,
  },
  props: {},
  data() {
    return {
      gameConfigsLoaded: false,
      deckType: null,
      deckList: { release: 'Релиз', auto: 'Авто', bank: 'Банк' },
      gameType: null,
      gameList: { 'single-blitz': 'Фриланс', 'duel-blitz': 'Дуэль', 'ffa-blitz': 'Каждый за себя' },
      gameConfig: null,
      configList: {
        blitz: { title: 'Блиц' },
        standart: { title: 'Стандарт' },
        hardcore: { title: 'Хардкор' },
      },
      gameTimer: 60,
    };
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      const store = this.state.store || {};

      // не придумал другого способа как предустановить configs с учетом синхронной подгрузки userData
      this.prepareGameConfigs(store.user?.[this.state.currentUser]);

      return store;
    },
    userData() {
      const currentUserData = this.store.user?.[this.state.currentUser] || {};
      return { id: this.state.currentUser, ...currentUserData };
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    lobbyGameList() {
      const list = Object.entries(this.lobby.games || {})
        .map(([id, game]) => Object.assign({}, game, { id }))
        .map((game) => {
          if (game.playerMap) {
            const players = Object.keys(game.playerMap).map((id) => game.store?.player[id] || {});
            game.joinedPlayers = players.filter((player) => player.ready).length + ' из ' + players.length;
          }
          if (game.status === 'WAIT_FOR_PLAYERS') game.waitForPlayer = true;
          return game;
        })
        .reverse();
      const sortedList = list.sort((a, b) => (a.waitForPlayer && !b.waitForPlayer ? -1 : 1));
      return sortedList;
    },
  },
  methods: {
    prepareGameConfigs(userData = {}) {
      if (this.gameConfigsLoaded) return;
      const configs = userData.lobbyGameConfigs;
      if (!configs) return;
      const { deckType, gameType, gameConfig, gameTimer } = configs.active;
      this.$set(this, 'deckType', deckType);
      this.$set(this, 'gameType', gameType);
      this.$set(this, 'gameConfig', gameConfig);
      if (gameTimer) this.$set(this, 'gameTimer', gameTimer);
      this.gameConfigsLoaded = true;
    },
    selectDeckType(type) {
      this.deckType = type;
    },
    selectGameType(type) {
      this.gameType = type;
    },
    selectGameConfig(type) {
      this.gameConfig = type;
    },
    updateGameTimer(timeShift) {
      this.gameTimer += timeShift;
      if (this.gameTimer > 120) this.gameTimer = 120;
      if (this.gameTimer < 15) this.gameTimer = 15;
    },
    async addGame() {
      if (!this.deckType || !this.gameType || !this.gameConfig) prettyAlert({ message: 'game config not set' });
      await api.action
        .call({
          path: 'domain.game.api.new',
          args: [
            {
              deckType: this.deckType,
              gameType: this.gameType,
              gameConfig: this.gameConfig,
              gameTimer: this.gameTimer,
            },
          ],
        })
        .then(({ gameId }) => {
          if (gameId) this.joinGame({ gameId });
        })
        .catch(prettyAlert);
    },
    async joinGame({ gameId, viewerMode }) {
      const avatars = this.lobby.avatars[this.userData.gender];
      const avatarCode = avatars[Math.floor(Math.random() * avatars.length)];

      await api.action
        .call({
          path: 'lib.game.api.join',
          args: [{ gameId, avatarCode, viewerMode }],
        })
        .catch(prettyAlert);
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss" scoped>
@import '@/mixins.scss';
.new-game-controls {
  @media only screen and (max-width: 360px) {
    font-size: 9px;
  }

  .breadcrumbs {
    text-align: center;
    padding: 10px 4px;

    .wait-for-select {
      border: none;
      cursor: default !important;
      &:hover {
        opacity: 1 !important;
      }
    }
  }

  .release-game {
    @include flex($wrap: wrap);
  }
  .game-types {
    @include flex();
    padding: 0px 10px;

    .select-btn {
      text-align: center;
      svg {
        width: 26px;
      }
    }
  }
  .release-game-config {
    @include flex();
    padding: 0px 10px;

    .select-btn {
      text-align: center;
    }
  }
  .release-game-start {
    @include flex();
    padding: 0px 10px;

    .select-btn {
      text-align: center;
      max-width: 100px;
    }

    .timer {
      color: #f4e205;
      font-size: 16px;

      svg {
        cursor: pointer;
        border: 1px solid;
        border-radius: 50%;
        padding: 0px 2px;
        color: black;
        background: #f4e205;
      }
    }
    .timer-label {
      margin: 0px 10px;
    }
  }

  .select-btn {
    width: 40%;
    text-align: left;
    border: 2px solid #f4e205;
    color: white;
    background-color: transparent;
    padding: 4px 10px;
    margin: 4px;
    border-radius: 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: pointer;

    @media only screen and (max-width: 360px) {
      padding: 4px 4px;
    }

    svg {
      width: 40px;
      @media only screen and (max-width: 360px) {
        width: 30px;
      }
    }
    &.active {
      background: #f4e205;
      color: black;
      svg {
        color: black !important;
      }
    }
    &.selected {
      &:after {
        content: 'X';
        color: black;
        padding: 0px 2px;
        font-weight: bold;
      }
    }
    &.disabled {
      border: 2px solid #ccc;
      background-color: #ccc;
      cursor: not-allowed;
    }

    &.wait-for-select:not(.disabled):hover {
      opacity: 0.7;
    }
  }
}

.game-item {
  @include flex($justify: space-between);
  margin: 4px auto;
  min-height: 30px;
  max-width: 300px;
}
.mobile-view .game-item {
  justify-content: center;
  > * {
    margin: 4px 10px;
  }
}

@media only screen and (max-width: 360px) {
  .join-btn {
    font-size: 9px;
    padding: 4px;
  }
}
</style>
