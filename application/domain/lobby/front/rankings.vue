<template>
  <div class="rankings">
    <div v-if="!menuOpened" class="title" v-on:click="menuOpened = true">
      <font-awesome-icon :icon="['fas', 'chart-simple']" size="xl" :style="{ paddingRight: '4px' }" />
      {{ activeRatingTitle }}
    </div>
    <div v-if="menuOpened" class="menu">
      Выбор рейтинга:
      <div v-for="game in gameList" :key="game.title">
        <h4 v-on:click="toggleMenuGameItem(game.code)">Игра "{{ game.title }}"</h4>
        <ul v-if="menuGameItems[game.code]?.open">
          <li v-for="ranking in game.rankingList" :key="ranking.title">
            <span
              v-on:click="
                menuOpened = false;
                activeRating = {
                  title: `${ranking.title} (Игра &quot;${game.title}&quot;)`,
                  headers: ranking.headers,
                  list: getUsersRankings({ gameType: game.code, usersList: ranking.usersTop }),
                };
              "
              >{{ ranking.title }}</span
            >
          </li>
        </ul>
      </div>
    </div>
    <div v-if="!menuOpened" class="content">
      <table v-if="activeRating">
        <tr>
          <th v-for="header in activeRatingHeaders" :key="header.code" :code="header.code">
            {{ header.title }}
          </th>
        </tr>
        <tr
          v-for="(item, idx) in activeRating.list"
          :key="idx"
          :class="[item.iam ? 'iam' : '', item.noGames ? 'no-games' : '']"
        >
          <td v-for="header in activeRatingHeaders" :key="header.code + idx" :code="header.code">
            {{ item[header.code] }}
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    games: Object,
  },
  data() {
    return {
      menuGameItems: {},
      menuOpened: false,
      activeRating: null,
    };
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    gameList() {
      return Object.entries(this.games).map(([code, game]) => ({
        ...game,
        code,
        rankingList: Object.entries(game.rankingMap).map(([code, ranking]) => ({ ...ranking, code })),
      }));
    },
    activeRatingTitle() {
      return this.activeRating?.title || 'Выберите рейтинг, который хотели бы посмотреть';
    },
    activeRatingHeaders() {
      return [{ code: 'idx' }, { code: 'player' }].concat(this.activeRating?.headers || []);
    },
  },
  methods: {
    toggleMenuGameItem(gameCode) {
      if (!this.menuGameItems[gameCode]) this.$set(this.menuGameItems, gameCode, {});
      this.$set(this.menuGameItems[gameCode], 'open', !this.menuGameItems[gameCode]?.open);
    },
    getUsersRankings({ gameType, usersList }) {
      const lobbyUsers = this.$root.state.store.lobby.main.users || {};
      const result = usersList.map((userId, idx) => ({
        idx: idx + 1,
        ...lobbyUsers[userId].rankings[gameType],
        player: lobbyUsers[userId].name || 'имя не указано',
        iam: userId === this.state.currentUser,
      }));
      if (result.filter((user) => user.iam).length === 0) {
        const userId = this.state.currentUser;
        result.push({ player: '...' });
        const iamItem = lobbyUsers[userId].rankings[gameType]
          ? { ...lobbyUsers[userId].rankings[gameType] }
          : { noGames: true };
        iamItem.idx = '-';
        iamItem.iam = true;
        iamItem.player = lobbyUsers[userId].name;
        result.push(iamItem);
      }
      return result;
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style lang="scss">
.rankings {
  display: flex;
  overflow: hidden !important;
}

.rankings > * {
  height: 100%;
  overflow: auto;
}

.rankings > .title {
  position: absolute;
  left: 0px;
  top: 0px;
  height: auto;
  padding: 6px 20px;
}
.rankings .title {
  color: #f4e205;
  font-weight: bold;
  white-space: pre-wrap;
  cursor: pointer;
  width: 100%;
  text-align: center;
  padding: 8px 0px;
}
.rankings > .title:hover {
  opacity: 0.7;
}
.rankings > .menu {
  width: 100%;
  left: 0px;
  top: 0px;
  text-align: left;
  padding: 6px 20px;
  background: url(@/assets/clear-black-back.png);
  z-index: 1;
}
.rankings > .menu h4 {
  cursor: pointer;
  color: #f4e205;
}
.rankings > .menu h4:hover {
  opacity: 0.7;
}
.rankings > .menu ul {
  text-align: left;
  list-style-type: square;
}
.rankings > .menu ul > li {
  cursor: pointer;
}
.rankings > .menu ul > li:hover {
  opacity: 0.7;
}

.rankings > .content {
  width: 100%;
  margin: 4px 10px;
  margin-top: 30px;
  height: calc(100% - 30px);
}
.rankings > .content table {
  min-width: 400px;
  margin-bottom: 10px;
}
.rankings > .content table th {
  white-space: nowrap;
  font-size: 10px;
}
.rankings > .content table th[code='player'] {
  width: 100%;
}
.rankings > .content table tr.iam {
  color: #f4e205;
  font-weight: bold;
}
.rankings > .content table td[code='idx'] {
  white-space: nowrap;
}
.rankings > .content table tr.iam.no-games > td[code='player'] {
  position: relative;
}
.rankings > .content table tr.iam.no-games > td[code='player']:after {
  content: 'в эту игру еще не играли';
  position: absolute;
  left: 100%;
  white-space: nowrap;
  text-align: left;
  font-style: italic;
  font-size: 10px;
  line-height: 13px;
  color: #aaa;
}
</style>
