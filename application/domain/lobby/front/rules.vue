<template>
  <perfect-scrollbar>
    <div>
      <ul>
        <li class="disabled">
          <label class="not-disabled">Игра "Релиз"</label>
          <div>Игра про ИТ-разработку</div>
          <ul>
            <li>
              <label v-on:click.stop="showRules('release')">Правила игры</label>
              <hr />
              <span v-on:click="showGallery('release')">Список карт</span>
            </li>
          </ul>
        </li>
        <li class="disabled">
          <label>Автобизнес</label>
          <div>Колода для игр про продажи автомобилей</div>
          <ul>
            <li>
              <label v-on:click.stop="showRules('auto-deck')">Описание колоды</label>
              <hr />
              <span v-on:click="showGallery('auto', 'car')">Карты авто</span><br />
              <span v-on:click="showGallery('auto', 'service')">Карты сервисов</span><br />
              <span v-on:click="showGallery('auto', 'client')">Карты клиентов</span><br />
              <span v-on:click="showGallery('auto', 'spec')">Карты особенностей</span><br />
            </li>
            <li>
              <label v-on:click.stop="showRules('auto-sales')">Игра "Авто-продажи"</label>
            </li>
            <li>
              <label v-on:click.stop="showRules('auto-auction')">Игра "Авто-аукцион"</label>
            </li>
            <li>
              <label v-on:click.stop="showRules('auto-express')">Игра "Авто-экспресс"</label>
            </li>
          </ul>
        </li>
        <li class="disabled">
          <label>Скорринг</label>
          <div>Колода для игр про работу в банках</div>
          <ul>
            <li>
              <label v-on:click.stop="showRules('bank-deck')">Описание колоды</label>
              <hr />
              <span v-on:click="showGallery('bank', 'product')">Карты продуктов</span><br />
              <span v-on:click="showGallery('bank', 'service')">Карты сервисов</span><br />
              <span v-on:click="showGallery('bank', 'scoring')">Карты скоринга</span><br />
              <span v-on:click="showGallery('bank', 'client')">Карты клиентов</span><br />
              <span v-on:click="showGallery('bank', 'spec')">Карты особенностей</span><br />
            </li>
            <li>
              <label v-on:click.stop="showRules('bank-sales')">Игра "Банк-продаж"</label>
            </li>
            <li>
              <label v-on:click.stop="showRules('bank-risks')">Игра "Банк-рисков"</label>
            </li>
          </ul>
        </li>
      </ul>
      <!-- <iframe id="fred" style="border:1px solid #666CCC" title="PDF in an i-Frame" src="./rules.pdf" frameborder="1" scrolling="auto" height="1100" width="850" ></iframe> -->
    </div>
  </perfect-scrollbar>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

export default {
  components: {
    PerfectScrollbar,
  },
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
    showRules(name) {
      api.action
        .call({
          path: 'lib.helper.api.action',
          args: [{ tutorial: 'lobby-tutorial-gameRules', step: name }],
        })
        .catch(prettyAlert);
      return;
    },
    showGallery(deck, type) {
      let images = [];
      switch (deck) {
        case 'release':
          images = [
            { name: 'audit' },
            { name: 'claim' },
            { name: 'coffee' },
            { name: 'crutch' },
            { name: 'crutch' },
            { name: 'crutch' },
            { name: 'disease' },
            { name: 'dream' },
            { name: 'emergency' },
            { name: 'flowstate' },
            { name: 'give_project' },
            { name: 'insight' },
            { name: 'lib' },
            { name: 'pilot' },
            { name: 'refactoring' },
            { name: 'req_legal' },
            { name: 'req_tax' },
            { name: 'security' },
            { name: 'showoff' },
            { name: 'superman' },
            { name: 'take_project' },
            { name: 'teamlead' },
            { name: 'transfer' },
            { name: 'weekend' },
            { name: 'water' },
          ]
            .map(({ name }) => `release/${name}.jpg`)
            .filter((value, index, array) => {
              return array.indexOf(value) === index;
            });
          break;
        case 'auto':
          switch (type) {
            case 'car':
              for (let i = 1; i <= 32; i++) images.push(`auto/car/car (${i}).png`);
              break;
            case 'service':
              for (let i = 1; i <= 32; i++) images.push(`auto/service/service (${i}).png`);
              break;
            case 'client':
              for (let i = 1; i <= 24; i++) images.push(`auto/client/client (${i}).png`);
              break;
            case 'spec':
              for (let i = 1; i <= 24; i++) images.push(`auto/spec/spec (${i}).png`);
              break;
          }
          break;
        case 'bank':
          switch (type) {
            case 'product':
              for (let i = 1; i <= 32; i++) images.push(`bank/product/product (${i}).png`);
              break;
            case 'service':
              for (let i = 1; i <= 32; i++) images.push(`bank/service/service (${i}).png`);
              break;
            case 'client':
              for (let i = 1; i <= 24; i++) images.push(`bank/client/client (${i}).png`);
              break;
            case 'spec':
              for (let i = 1; i <= 24; i++) images.push(`bank/spec/spec (${i}).png`);
              break;
            case 'scoring':
              for (let i = 1; i <= 38; i++) images.push(`bank/scoring/scoring (${i}).png`);
              break;
          }
          break;
      }

      new Fancybox(images.map((path) => ({ src: `/img/cards/${path}`, type: 'image' })));
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss">
.rankings {
  overflow: hidden !important;
}
.rankings > * {
  height: 100%;
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
  width: calc(100% - 20px);
  height: calc(100% - 30px);
  margin: 4px 10px;
  margin-top: 30px;
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
