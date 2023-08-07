<template>
  <div class="rankings">
    <div v-if="!menuOpened" class="title" v-on:click="menuOpened = true">
      <font-awesome-icon :icon="['fas', 'chart-simple']" size="xl" :style="{ paddingRight: '4px' }" />
      {{ activeRatingTitle }}
    </div>
    <div v-if="menuOpened" class="menu">
      Выбор рейтинга:
      <div v-for="game in games" :key="game.title">
        <h4 v-on:click="$set(game, 'open', !game.open)">Игра "{{ game.title }}"</h4>
        <ul v-if="game.open">
          <li v-for="ranking in game.list" :key="ranking.title">
            <span
              v-on:click="
                menuOpened = false;
                activeRating = {
                  title: `${ranking.title} (Игра &quot;${game.title}&quot;)`,
                  headers: ranking.headers,
                  list: ranking.list,
                };
              "
              >{{ ranking.title }}</span
            >
          </li>
        </ul>
      </div>
    </div>
    <div class="content">
      <table v-if="activeRating">
        <tr>
          <th v-for="header in activeRatingHeaders" :key="header.code" :code="header.code">
            {{ header.title }}
          </th>
        </tr>
        <tr v-for="(item, idx) in activeRating.list" :key="idx">
          <td v-for="header in activeRatingHeaders" :key="header.code + idx">{{ item[header.code] }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    games: Array,
  },
  data() {
    return {
      menuOpened: false,
      activeRating: null,
    };
  },
  watch: {},
  computed: {
    activeRatingTitle() {
      return this.activeRating?.title || 'Выберите рейтинг, который хотели бы посмотреть';
    },
    activeRatingHeaders() {
      return [{ code: 'player' }].concat(this.activeRating?.headers || []);
    },
  },
  methods: {},
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
  position: absolute;
  width: 100%;
  left: 0px;
  top: 0px;
  text-align: left;
  padding: 6px 20px;
  background: url(@/assets/clear-black-back.png);
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
  padding: 4px 10px;
}
.rankings > .content table {
  padding-top: 30px;
}
.rankings > .content table th {
  white-space: nowrap;
}
.rankings > .content table th[code='player'] {
  width: 100%;
}
</style>
