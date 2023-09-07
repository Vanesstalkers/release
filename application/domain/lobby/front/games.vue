<template>
  <div>
    <div class="new-game-controls">
      <div class="release-game">
        <div v-on:click="addGame({ type: 'release', subtype: 'single-blitz' })">
          <font-awesome-icon :icon="['fas', 'user']" size="2xl" />
          Фриланс
        </div>
        <div v-on:click="addGame({ type: 'release', subtype: 'duel-blitz' })">
          <font-awesome-icon :icon="['fas', 'user-group']" size="2xl" />
          Дуэль
        </div>
        <div v-on:click="addGame({ type: 'release', subtype: 'ffa-blitz' })">
          <font-awesome-icon :icon="['fas', 'users']" size="2xl" />
          Каждый за себя
        </div>
        <div class="disabled">
          <font-awesome-icon :icon="['fas', 'dice-four']" size="2xl" style="color: #fff" />
          Команды
        </div>
      </div>
    </div>
    <hr :style="{ margin: '10px 30px', borderColor: '#f4e205' }" />
    <div>
      <perfect-scrollbar>
        <div v-for="game in lobbyGameList" :key="game._id" class="game-item">
          Раунд: ( {{ game.round }} ) Игроков: ( {{ game.joinedPlayers }} )
          <span v-if="!game.waitForPlayer" :style="{ color: '#f4e205' }">Идёт игра</span>
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
    return {};
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    userData() {
      const currentUserData = this.store.user?.[this.state.currentUser];
      return { id: this.state.currentUser, ...(currentUserData || {}) };
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
    async addGame({ type, subtype } = {}) {
      if (!type || !subtype) throw new Error('game type not set');
      await api.action
        .call({
          path: 'domain.game.api.new',
          args: [{ type, subtype }],
        })
        .then(({ gameId }) => {
          if (gameId) this.joinGame({ gameId });
        })
        .catch(prettyAlert);
    },
    async joinGame({ gameId }) {
      const avatars = this.lobby.avatars[this.userData.gender];
      const avatarCode = avatars[Math.floor(Math.random() * avatars.length)];

      await api.action
        .call({
          path: 'lib.game.api.join',
          args: [{ gameId, avatarCode }],
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

  .release-game {
    @include flex($wrap: wrap);

    div {
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

      &.disabled {
        border: 2px solid #ccc;
        background-color: #ccc;
        cursor: not-allowed;
      }
      &:not(.disabled):hover {
        background: #f4e205;
        color: black;

        svg {
          color: black !important;
        }
      }
    }
  }
}

.game-item {
  @include flex($justify: space-between);
  margin: 4px auto;
	min-height: 30px;
	max-width: 300px;
}

@media only screen and (max-width: 360px) {
  .join-btn {
    font-size: 9px;
    padding: 4px;
  }
}
</style>
