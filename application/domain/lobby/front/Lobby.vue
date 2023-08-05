<template>
  <div
    id="lobby"
    :class="[
      state.isMobile ? 'mobile-view' : '',
      state.isLandscape ? 'landscape-view' : 'portrait-view',
      !state.currentUser ? 'need-auth' : '',
    ]"
  >
    <div v-if="!state.currentUser" class="auth">
      <div class="form">
        <h3>Вход в лобби</h3>
        <div class="inputs">
          <input v-model="auth.login" name="login" placeholder="login" />
          <span :style="{ width: '10px' }"></span>
          <input v-model="auth.password" name="password" placeholder="password" />
        </div>
        <button v-on:click="login">Войти с паролем</button>
        <button class="new" v-on:click="createDemoUser">Создать нового пользователя</button>
      </div>
    </div>
    <helper />

    <!-- <div :style="{ zIndex: 100, position: 'absolute', background: 'red' }">{{ $root.state }}</div> -->

    <div :class="['menu-item', 'info', !state.isMobile ? 'preview' : '']">
      <label v-on:click="pinMenuItem">
        УСЛУГИ СТУДИИ <font-awesome-icon icon="fa-solid fa-thumbtack" class="fa-xs" />
      </label>
      <div>
        <ul>
          <li>
            <label v-on:click.stop="showInfo('games')">Разработка игр на заказ</label>
            <div>Настольные обучающие игры для любой сферы бизнеса</div>
          </li>
          <li>
            <label v-on:click.stop="showInfo('it')">Создание онлайн-версий игр</label>
            <div>Собственная команда программистов</div>
          </li>
          <li>
            <label v-on:click.stop="showInfo('contacts')">Связаться с нами</label>
            <div>Контактная информация</div>
          </li>
        </ul>
      </div>
    </div>
    <div class="menu-item game">
      <label v-on:click="pinMenuItem">
        ИГРОВАЯ КОМНАТА <font-awesome-icon icon="fa-solid fa-thumbtack" class="fa-xs" />
      </label>
      <div>
        <div class="new-game-btn-list">
          <div v-on:click="addGame('single-blitz')">
            <font-awesome-icon :icon="['fas', 'user']" size="2xl" />
            Фриланс
          </div>
          <div v-on:click="addGame('duel-blitz')">
            <font-awesome-icon :icon="['fas', 'user-group']" size="2xl" />
            Дуэль
          </div>
          <div v-on:click="addGame('ffa-blitz')">
            <font-awesome-icon :icon="['fas', 'users']" size="2xl" />
            Каждый за себя
          </div>
          <div class="disabled">
            <font-awesome-icon :icon="['fas', 'dice-four']" size="2xl" style="color: #fff" />
            Команды
          </div>
        </div>
        <hr :style="{ margin: '10px 30px', borderColor: '#f4e205' }" />
        <div v-for="game in lobbyGameList" :key="game._id">
          Раунд: ( {{ game.round }} ) Набрано игроков: ( {{ game.joinedPlayers }} )
          <button class="lobby-btn" v-on:click="joinGame({ gameId: game.id })">Присоединиться к игре</button>
        </div>
      </div>
    </div>
    <div class="menu-item list">
      <label v-on:click="pinMenuItem">
        ПРАВИЛА ИГР <font-awesome-icon icon="fa-solid fa-thumbtack" class="fa-xs" />
      </label>
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
    </div>
    <div class="menu-item chat">
      <label v-on:click="pinMenuItem"> ОБЩЕНИЕ <font-awesome-icon icon="fa-solid fa-thumbtack" class="fa-xs" /> </label>
      <div :style="{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden' }">
        <div
          class="user-list"
          :style="{
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            borderBottom: '2px solid #f4e205',
            padding: '10px',
          }"
        >
          <label class="user-list-label" :style="{ width: '100%' }"
            >Игроки онлайн ({{ lobbyUserGuestsCount + lobbyUserList.length }})</label
          >
          <div class="user-list">
            <span v-if="lobbyUserGuestsCount">Гость ({{ lobbyUserGuestsCount }})</span>
            <span v-for="user in lobbyUserList" :key="user.id">
              {{ user.name }}
            </span>
          </div>
        </div>
        <div
          :style="{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            overflow: 'hidden',
          }"
        >
          <div
            class="msg-list"
            :style="{ paddingBottom: '80px', paddingTop: '10px', paddingLeft: '10px', paddingRight: '10px' }"
          >
            <div v-for="msg in getChat" :key="msg._id">
              <div v-if="msg.text" class="msg">
                <div class="header">
                  <b>{{ msg.user.name }}</b>
                  <i>{{ msg.timeStr }}</i>
                </div>
                {{ msg.text }}
              </div>
              <div v-if="msg.event" class="event" :time="msg.timeStr">
                Игрок <span>{{ lobbyUserMap[msg.user.id]?.name || '' }}</span>
                {{
                  msg.event === 'enter' ? 'зашел в лобби' : msg.event === 'leave' ? 'вышел из лобби' : 'что-то сделал'
                }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="chat-controls"
          :style="{
            position: 'absolute',
            width: '100%',
            display: 'flex',
            left: '0px',
            bottom: '0px',
            boxShadow: 'inset 0px -20px 20px 20px black',
          }"
        >
          <div
            v-if="!userData.name"
            :style="{
              position: 'absolute',
              width: '100%',
              height: '100%',
              left: '0px',
              top: '0px',
              background: 'black',
              paddingTop: '10px',
              zIndex: '2',
            }"
          >
            <div :style="{ padding: '8px' }">Укажите свое имя, чтобы начать писать в чат</div>
            <div :style="{ display: 'flex', justifyContent: 'space-evenly' }">
              <input
                v-model="userName"
                :style="{ border: '1px solid #f4e205', background: 'black', color: 'white', padding: '4px 10px' }"
              /><button v-on:click="saveName" class="lobby-btn">Сохранить</button>
            </div>
          </div>
          <textarea
            v-model="chatMsgText"
            rows="3"
            :style="{
              width: '100%',
              background: 'black',
              border: '1px solid #f4e205',
              resize: 'none',
              color: 'white',
              padding: '10px',
              margin: '10px',
              zIndex: '1',
            }"
          />
          <button
            :disabled="disableSendMsgBtn > 0"
            v-on:click="sendChatMsg"
            class="lobby-btn"
            :style="{
              color: '#ffffff',
              width: '40px',
              height: '40px',
              marginTop: '10px',
              marginRight: '10px',
              boxShadow: 'black -10px 10px 20px 20px',
              zIndex: '0',
            }"
          >
            <span v-if="disableSendMsgBtn > 0"> {{ disableSendMsgBtn }} </span>
            <font-awesome-icon v-if="disableSendMsgBtn === 0" :icon="['fas', 'share']" />
          </button>
        </div>
      </div>
    </div>
    <div class="menu-item top">
      <label v-on:click="pinMenuItem">
        ЗАЛ СЛАВЫ <font-awesome-icon icon="fa-solid fa-thumbtack" class="fa-xs" />
      </label>
      <div :style="{ display: 'flex' }">
        <div :style="{ width: '200px' }">
          {{ rankingsList }}
        </div>
        <div :style="{ width: 'calc(100% - 200px)' }">
          {{ currentRanking }}
        </div>
      </div>
    </div>

    <img
      id="bg-img"
      src="./assets/lobby.png"
      usemap="#image-map"
      :style="{
        position: 'absolute',
        left: `${bg.left || 0}px`,
        top: `${bg.top || 0}px`,
        scale: bg.scale || 1,
        transformOrigin: 'center',
        filter: 'grayscale(1)',
      }"
    />
  </div>
</template>

<script>
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

import helper from '~/lib/helper/front/helper.vue';

export default {
  components: {
    helper,
  },
  data() {
    return {
      auth: { login: '', password: '' },
      userName: '',
      chatMsgText: '',
      disableSendMsgBtn: 0,
      bg: {
        top: 0,
        left: 0,
        showMask: '',
      },
    };
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
      return this.store.user?.[this.state.currentUser] || {};
    },
    lobbyUserMap() {
      return this.lobby?.users || {};
    },
    lobbyUserList() {
      return Object.entries(this.lobbyUserMap)
        .filter(([id, user]) => user && user.name && user.online)
        .map(([id, user]) => Object.assign(user, { id }));
    },
    lobbyUserGuestsCount() {
      return Object.values(this.lobby?.users || {}).filter((user) => user && !user.name && user.online).length;
    },
    lobby() {
      return this.store.lobby?.main || {};
    },
    rankings() {
      return this.lobby.rankings || {};
    },
    rankingsList() {
      return Object.values(this.rankings).map((r) => ({ title: r.title, active: r.active }));
    },
    currentRanking() {
      return Object.values(this.rankings).find((r) => r.active)?.list || [];
    },

    lobbyGameMap() {
      return this.lobby?.games || {};
    },
    lobbyGameList() {
      const list = Object.entries(this.lobbyGameMap).map(([id, game]) => Object.assign(game, { id }));
      return list.map((game) => {
        if (game.playerMap) {
          const players = Object.keys(game.playerMap).map((id) => game.store?.player[id] || {});
          game.joinedPlayers = players.filter((player) => player.ready).length + ' из ' + players.length;
        }
        return game;
      });
    },
    getChat() {
      const items = Object.entries(this.lobby?.chat || {})
        .map(([id, msg]) =>
          Object.assign({}, msg, {
            id,
            timeStr: new Date(msg.time).toLocaleString(),
          })
        )
        .reverse();
      return items;
    },
  },
  methods: {
    async initSession({ login, password, demo } = {}) {
      const token = localStorage.getItem('metarhia.session.token');
      const session = await api.auth
        .initSession({ token, windowTabId: window.name, login, password, demo })
        .catch((err) => {
          console.log(err);
          return {};
        });

      const { token: sessionToken, userId, reconnect } = session;
      if (reconnect) {
        const { workerId, ports } = reconnect;
        const port = ports[workerId.substring(1) * 1 - 1];
        location.href = `${location.origin}?port=${port}`;
        return;
      }

      if (sessionToken && sessionToken !== token) localStorage.setItem('metarhia.session.token', sessionToken);
      if (userId) {
        this.$root.state.currentUser = userId;
        await this.callLobbyEnter();
      }
    },
    async createDemoUser() {
      await this.initSession({ demo: true });
    },
    async login() {
      await this.initSession({ login: this.auth.login, password: this.auth.password });
    },
    async callLobbyEnter() {
      await api.action
        .call({
          path: 'domain.lobby.api.enter',
        })
        .catch((err) => {
          prettyAlert(err.message);
        });
    },

    show(mask) {
      if (mask === '' && this.state.isMobile) return;
      this.bg.showMask = mask;
    },
    pinMenuItem(e) {
      e.target.closest('.menu-item').classList.toggle('pinned');
    },
    async addGame(type) {
      await api.action
        .call({
          path: 'domain.game.api.new',
          args: [{ type }],
        })
        .then(({ gameId }) => {
          if (gameId) this.joinGame({ gameId });
        })
        .catch((err) => {
          prettyAlert(err.message);
        });
    },
    async joinGame({ gameId }) {
      await api.action
        .call({
          path: 'lib.game.api.join',
          args: [{ gameId }],
        })
        .catch((err) => {
          prettyAlert(err.message);
        });
    },
    showInfo(name) {
      api.action.call({
        path: 'lib.helper.api.action',
        args: [{ tutorial: 'lobby-tutorial-sales', step: name }],
      });
    },
    showRules(name) {
      api.action.call({
        path: 'lib.helper.api.action',
        args: [{ tutorial: 'lobby-tutorial-gameRules', step: name }],
      });
      return;
    },
    saveName() {
      api.action.call({
        path: 'lib.user.api.update',
        args: [{ name: this.userName }],
      });
    },
    sendChatMsg() {
      this.disableSendMsgBtn = 5;
      api.action
        .call({
          path: 'domain.lobby.api.updateChat',
          args: [{ text: this.chatMsgText }],
        })
        .then((data) => {
          this.chatMsgText = '';
          this.restoreMsgBtn();
        })
        .catch((err) => {
          this.restoreMsgBtn();
        });

      // api.lobby
      //   .updateChat({ text: this.chatMsgText })
      //   .then((data) => {
      //     this.chatMsgText = '';
      //     this.restoreMsgBtn();
      //   })
      //   .catch((err) => {
      //     this.restoreMsgBtn();
      //   });
    },
    restoreMsgBtn() {
      if (this.disableSendMsgBtn > 0) {
        this.disableSendMsgBtn--;
        setTimeout(this.restoreMsgBtn, 1000);
      }
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
  async mounted() {
    // console.log('mounted');

    const self = this;
    function resize() {
      const bgHeight = 1024;
      const bgWidth = 2048;
      self.bg.top = window.innerHeight / 2 - bgHeight / 2;
      self.bg.left = window.innerWidth / 2 - bgWidth / 2;
      self.bg.scale = Math.max(window.innerHeight / bgHeight, window.innerWidth / bgWidth);
    }
    resize();
    window.addEventListener('resize', resize);

    if (this.state.currentUser) {
      this.callLobbyEnter();
    } else {
      this.initSession();
    }
  },
  async beforeDestroy() {
    // await api.action
    //   .call({
    //     path: 'domain.lobby.api.exit',
    //   })
    //   .catch((err) => {
    //     prettyAlert(err.message);
    //   });
  },
};
</script>
<style lang="scss">
#lobby {
  height: 100%;
  width: 100%;
  /*  */
}

:root {
  --size: 3;
  --skew: 7;
  --orange: hsl(20, 100%, 71%);
  --svgfilter: url(#squiggly-0);
  --boxshadow: rgb(22, 12, 3);
  --textshadow: rgb(42, 22, 23);
}
@media only screen and (max-width: 600px) {
  :root {
    --size: 2;
  }
}
@media only screen and (max-width: 400px) {
  :root {
    --size: 1.4;
  }
}
.lightning:before,
.lightning:after {
  content: '';
  width: 25%;
}
.lightning {
  z-index: 1;

  display: flex;
  position: relative;
  margin: 4vmin;
  filter: var(--svgfilter);
  span {
    color: black;
    letter-spacing: 10px; //calc(var(--size) * 1vmin);
    font-size: 1rem;
    padding: calc(0.5 * 1rem) 0 0 0;
    margin-right: -1rem;
    text-align: left;
    text-shadow: none;
  }
  > * {
    margin: 0;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: 20px 40px; //calc(var(--size) * 0.8vmin) calc(var(--size) * 1.6vmin);
    background: rgba(#f4e205, 1); //yellow;

    transform: skew(calc(var(--skew) * -1deg), calc(var(--skew) * -1deg));
    font-size: 80px; //calc(var(--size) * 3vmax);
    font-weight: 700;
    color: Crimson;

    text-transform: uppercase;
    text-align: right;
    border: 3px solid var(--boxshadow);
    border-left: 0;
    text-shadow: var(--textshadow) 0px 0px 0px, var(--textshadow) 0.669131px 0.743145px 0px,
      var(--textshadow) 1.33826px 1.48629px 0px, var(--textshadow) 2.00739px 2.22943px 0px,
      var(--textshadow) 2.67652px 2.97258px 0px, var(--textshadow) 3.34565px 3.71572px 0px,
      var(--textshadow) 4.01478px 4.45887px 0px, var(--textshadow) 4.68391px 5.20201px 0px;
    box-shadow: var(--border) 0px 0px 0px, var(--boxshadow) 0.819152px 0.573576px 0px,
      var(--boxshadow) 1.6383px 1.14715px 0px, var(--boxshadow) 2.45746px 1.72073px 0px,
      var(--boxshadow) 3.27661px 2.29431px 0px, var(--boxshadow) 4.09576px 2.86788px 0px,
      var(--boxshadow) 4.91491px 3.44146px 0px, var(--boxshadow) 5.73406px 4.01504px 0px,
      var(--boxshadow) 6.55322px 4.58861px 0px, var(--boxshadow) 7.37237px 5.16219px 0px,
      var(--boxshadow) 8.19152px 5.73576px 0px, var(--boxshadow) 9.01067px 6.30934px 0px,
      var(--boxshadow) 9.82982px 6.88292px 0px, var(--boxshadow) 10.649px 7.45649px 0px,
      var(--boxshadow) 11.4681px 8.03007px 0px;
    &:last-child {
      left: calc(var(--size) * -1vmin);
      position: relative;
      text-align: left;
      // font-size: 8vmin;
      span {
        border-top: 1px solid;
      }
    }
  }
}

.menu-item {
  z-index: 1;
  position: absolute;
  transform: translate(-50%, -50%);
  transition: top 0.7s;
}
.menu-item.pinned,
.menu-item.preview {
  z-index: 2;
}
.menu-item > label {
  cursor: pointer;
  color: crimson;
  text-shadow: var(--textshadow) 0px 0px 0px, var(--textshadow) 0.669131px 0.743145px 0px,
    var(--textshadow) 1.33826px 1.48629px 0px, var(--textshadow) 2.00739px 2.22943px 0px,
    var(--textshadow) 2.67652px 2.97258px 0px, var(--textshadow) 3.34565px 3.71572px 0px,
    var(--textshadow) 4.01478px 4.45887px 0px, var(--textshadow) 4.68391px 5.20201px 0px;
  font-family: fantasy;
  font-weight: bold;
  letter-spacing: 10px;
  white-space: nowrap;
  padding-left: 6px;

  font-size: 3em;
  background-image: linear-gradient(#f4e205, #f4e205);
  background-size: 100% 10px;
  background-repeat: no-repeat;
  background-position: 100% 0%;
  transition: background-size 0.7s, background-position 0.5s ease-in-out;
}
.menu-item:hover > label,
.menu-item.pinned > label,
.menu-item.tutorial-active > label {
  background-size: 100% 100%;
  background-position: 0% 100%;
  transition: background-position 0.7s, background-size 0.5s ease-in-out;
  box-shadow: 1px 0px 20px 6px rgba(0, 0, 0, 1);
}
.menu-item > label > svg {
  display: none;
  padding: 10px;
  position: absolute;
  right: 100%;
  color: #f4e205;
}
.menu-item:hover > label > svg {
  display: inline-block;
}

.menu-item > div {
  visibility: hidden;
  opacity: 0;
  border: 4px solid #f4e205;
  position: absolute;
  left: 0px;
  top: 100%;
  background-image: url(@/assets/clear-black-back.png);
  color: white;
  transition: visibility 0s, opacity 0.5s linear;
  overflow: auto;
}
.menu-item.pinned > div,
.menu-item.tutorial-active > div {
  max-height: none !important;
}
#lobby:not(.mobile-view) .menu-item:hover > div,
.menu-item.pinned > div,
.menu-item.preview > div,
.menu-item.tutorial-active > div {
  visibility: visible;
  opacity: 1;
}

.menu-item.info {
  top: 5%;
  left: calc(50% + 350px);
}
.menu-item.info > label {
  font-size: 24px;
  letter-spacing: 6px;
  color: black;
  text-shadow: white 0px 0px 0px, white 0.669131px 0.743145px 0px, white 1.33826px 1.48629px 0px,
    white 2.00739px 2.22943px 0px, white 2.67652px 2.97258px 0px, white 3.34565px 3.71572px 0px,
    white 4.01478px 4.45887px 0px, white 4.68391px 5.20201px 0px;
  background-image: linear-gradient(crimson, crimson);
}
.menu-item.info > label > svg {
  color: crimson;
}
.menu-item.info.preview:not(.pinned) > div {
  height: 180px;
  overflow: hidden;
}
.menu-item.info > div,
.menu-item.info.preview:hover > div {
  height: 270px;
  width: 400px;
  border-color: crimson;
}

.menu-item.game {
  top: 70%;
  left: 45%;
}
.menu-item.game.pinned,
.menu-item.game.tutorial-active {
  top: 45%;
  left: 45%;
}
.menu-item.game > label {
  display: block;
  white-space: pre-line;
}
.menu-item.game > div {
  height: 300px;
  width: 500px;
  max-height: 200px;
}
.menu-item.chat {
  top: 60%;
  left: 10%;
}
.menu-item.chat.pinned,
.menu-item.chat.tutorial-active {
  top: 10%;
  left: 10%;
}
.menu-item.chat > div {
  height: 500px;
  width: 300px;
  max-height: 200px;
}
.menu-item.top {
  top: 35%;
  left: 40%;
}
.menu-item.top.pinned,
.menu-item.top.tutorial-active {
  top: 10%;
  left: 40%;
}
.menu-item.top > div {
  height: 200px;
  width: 500px;
}
.menu-item.list {
  top: 45%;
  left: 80%;
}
.menu-item.list.pinned,
.menu-item.list.tutorial-active {
  top: 20%;
  left: 80%;
}
.menu-item.list > div {
  height: 500px;
  width: 400px;
  max-height: 300px;
}

#lobby.mobile-view .menu-item {
  left: 0px;
  width: 100%;
  transform: none;
}
#lobby.mobile-view .menu-item > div {
  top: auto;
  left: 5%;
  width: 90%;
  height: 100%;
}
#lobby.mobile-view .menu-item.pinned,
#lobby.mobile-view .menu-item.tutorial-active {
  top: 20% !important;
  height: 70%;
  z-index: 2;
}
#lobby.mobile-view.landscape-view .menu-item.pinned,
#lobby.mobile-view.landscape-view .menu-item.tutorial-active {
  top: 10% !important;
}
#lobby.mobile-view .menu-item.info {
  top: 25%;
}
#lobby.mobile-view .menu-item.top {
  top: 35%;
}
#lobby.mobile-view .menu-item.list {
  top: 50%;
}
#lobby.mobile-view .menu-item.chat {
  top: 65%;
}
#lobby.mobile-view .menu-item.game {
  top: 80%;
}
#lobby.mobile-view .menu-item.game > label {
  max-width: 220px;
  margin: auto;
}
#lobby.mobile-view.portrait-view .menu-item.game > div {
  height: 90%;
}
#lobby.mobile-view.landscape-view .menu-item.game > label {
  max-width: 450px;
}

.menu-item.tutorial-active {
  background: white;
}

#lobby:before {
  content: '';
  z-index: 1;
  position: absolute;
  left: 0px;
  top: 0px;
  height: 100%;
  width: 100%;
  background-image: url(assets/logo.png);
  background-size: 400px 200px;
  background-position: center top;
  background-repeat: no-repeat;
}
#lobby.mobile-view:before {
  background-size: 300px 150px;
}
#lobby.mobile-view.landscape-view:before {
  top: -25px;
}

.menu-item.info ul,
.menu-item.list ul {
  font-size: 18px;
  color: white;
  text-align: left;
}
.menu-item.info ul > li,
.menu-item.list ul > li {
  padding-bottom: 20px;
}
.menu-item.info ul > li > label,
.menu-item.info ul > li > label > a,
.menu-item.info ul > li::marker,
.menu-item.list ul > li > label,
.menu-item.list ul > li > label > a,
.menu-item.list ul > li::marker {
  cursor: pointer;
  font-family: fantasy;
  font-size: 24px;
  color: #f4e205;
}
.menu-item.list ul > li > span {
  cursor: pointer;
  color: #f4e205;
}

.menu-item ul > li.white > label,
.menu-item ul > li.white > label > a,
.menu-item ul > li.white::marker {
  color: white;
}
.menu-item.info ul > li > label,
.menu-item.info ul > li > label > a,
.menu-item.info ul > li::marker {
  color: crimson;
}
.menu-item.info ul > li > label > a,
.menu-item.list ul > li > label > a {
  font-size: 16px;
}
.menu-item.list ul > li:not(.disabled) > label:hover,
.menu-item.list ul > li > span:hover,
.menu-item.list ul > li:not(.disabled):hover::marker {
  color: white;
}

.menu-item.list ul > li.disabled > label {
  cursor: default !important;
}
.menu-item.list ul > li.disabled > label:not(.not-disabled):after {
  content: '(в разработке)';
  color: grey;
  font-size: 20px;
  padding-left: 10px;
}

.menu-item.list ul > li > hr {
  width: 80%;
  margin: 6px 0px;
}

.new-game-btn-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.new-game-btn-list > div {
  width: 40%;
  text-align: left;
  border: 2px solid #f4e205;
  color: white;
  background-color: transparent;
  padding: 4px 10px;
  margin: 4px;
  border-radius: 4px;
  cursor: pointer;
}
.new-game-btn-list > div > svg {
  width: 40px;
}
.new-game-btn-list > div.disabled {
  border: 2px solid #ccc;
  background-color: #ccc;
  cursor: not-allowed;
}
.new-game-btn-list > div:not(.disabled):hover {
  background: #f4e205;
  color: black;
}
.new-game-btn-list > div:not(.disabled):hover > svg {
  color: black !important;
}
.lobby-btn {
  background: #f4e205;
  border: 2px solid #f4e205;
  color: black;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}
.lobby-btn:hover,
.lobby-btn[disabled='disabled'] {
  background: black !important;
  color: #f4e205;
}
.chat .user-list-label {
  display: inherit;
  color: #f4e205;
  text-align: left;
  margin-bottom: 8px;
}
.chat .user-list {
  display: flex;
  flex-wrap: wrap;
}
.chat .user-list > span {
  border: 1px solid #f4e205;
  border-radius: 2px;
  padding: 2px 4px;
  margin: 2px;
}
.chat .msg-list {
  font-size: 16px;
  width: 100%;
}
.chat .msg-list .msg {
  padding: 8px;
  text-align: left;
}
.chat .msg-list .msg > .header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.chat .msg-list .msg > .header > b {
  color: #f4e205;
}
.chat .msg-list .msg > .header > i {
  font-size: 12px;
}

.chat .msg-list .event {
  padding: 8px;
  color: #f4e205;
}
.chat .msg-list .event > span {
  color: white;
}

.menu-item.pinned .chat-controls,
.menu-item.tutorial-active .chat-controls {
  display: flex !important;
}

#lobby > .auth {
  z-index: 10001;
  position: fixed;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  background-image: url(@/assets/clear-black-back.png);
  background-size: cover;
  display: grid;
}
#lobby > .auth > .form {
  align-self: center;
  justify-self: center;
  width: 400px;
  height: 200px;
  border: 4px solid #f4e205;
  display: flex;
  flex-wrap: wrap;
  color: #f4e205;
}
#lobby > .auth > .form > * {
  width: 100%;
}
#lobby > .auth > .form > .inputs {
  display: flex;
  margin: 10px;
}
#lobby > .auth > .form > .inputs > input {
  width: 50%;
  font-size: 14px;
  padding: 2px 8px;
  background: transparent;
  border: 2px solid #f4e205;
  color: #f4e205;
}
#lobby > .auth > .form > button {
  margin: 10px;
  background-color: #f4e205;
  border: 2px solid #f4e205;
  cursor: pointer;
}
#lobby > .auth > .form > button:hover {
  opacity: 0.7;
}
#lobby > .auth > .form > button.new {
  background: transparent;
  color: #f4e205;
}
</style>
