import Vue from 'vue';
import App from './App.vue';
import router from './router';
// import store from './store';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { Metacom } from '../lib/metacom.js';
import { mergeDeep } from '../lib/utils.js';

library.add(fas, far, fab);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.config.productionTip = false;
// window.vuex = store;

const init = async () => {
  if (!window.name) window.name = Date.now() + Math.random();
  window.prettyAlert = ({ message, hideMessage } = {}) => {
    if (message === 'Forbidden') {
      // стандартный ответ impress при доступе к запрещенному ресурсу (скорее всего нужна авторизация)
    } else alert(message);
  };

  // лежит как пример
  // router.beforeEach((to, from, next) => {
  //  return next({ name: 'Lobby' });
  // });

  const state = {
    currentUser: '',
    isMobile: false,
    isLandscape: true,
    isPortrait: false,
    guiScale: 1,
    store: {
      user: {},
    },
  };
  const mixin = {
    methods: {
      async initSession(config, handlers) {
        if (arguments.length < 2) {
          handlers = config;
          config = {};
        }
        const { login, password, demo } = config || {};
        const { success: onSuccess, error: onError } = handlers;

        const token = localStorage.getItem('metarhia.session.token');
        const session = await api.auth
          .initSession({ token, windowTabId: window.name, login, password, demo })
          .catch((err) => {
            if (typeof onError === 'function') onError(err);
          });

        const { token: sessionToken, userId, reconnect, lobbyList: [lobbyId] = [] } = session || {};
        if (reconnect) {
          const { workerId, ports } = reconnect;
          const port = ports[workerId.substring(1) * 1 - 1];
          location.href = `${location.origin}?port=${port}`;
          return;
        }

        if (sessionToken && sessionToken !== token) localStorage.setItem('metarhia.session.token', sessionToken);
        if (userId) {
          this.$root.state.currentUser = userId;
          this.$root.state.currentLobby = lobbyId;
          if (typeof onSuccess === 'function') onSuccess({ lobbyId });
        }
      },
    },
  };
  window.state = state;
  window.app = new Vue({
    router,
    mixins: [mixin],
    data: { state },
    render: function (h) {
      return h(App);
    },
  });

  const protocol = location.protocol === 'http:' ? 'ws' : 'wss';
  const port = new URLSearchParams(location.search).get('port') || 8800;
  const url =
    location.hostname === 'localhost' || location.hostname.startsWith('192.168.')
      ? `${location.hostname}:${port}`
      : `${location.hostname}/api`;
  const metacom = Metacom.create(`${protocol}://${url}`);
  const { api } = metacom;
  window.api = api;

  await metacom.load('auth', 'lobby', 'game', 'helper', 'db', 'session', 'user', 'action');

  api.db.on('smartUpdated', (data) => {
    mergeDeep({ target: state.store, source: data });
  });

  api.session.on('joinGame', (data) => {
    router.push({ path: `/game/${data.gameId}` }).catch((err) => {
      console.log(err);
    });
  });
  api.session.on('leaveGame', () => {
    router.push({ path: `/` }).catch((err) => {
      console.log(err);
    });
  });
  api.session.on('msg', ({ msg }) => {
    prettyAlert(msg);
  });

  window.app.$mount('#app');

  const { userAgent } = navigator;
  const isMobile = () =>
    userAgent.match(/Android/i) ||
    userAgent.match(/webOS/i) ||
    userAgent.match(/iPhone/i) ||
    userAgent.match(/iPad/i) ||
    userAgent.match(/iPod/i) ||
    userAgent.match(/BlackBerry/i) ||
    userAgent.match(/Windows Phone/i);

  const checkDevice = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    state.isMobile = isMobile() ? true : false;
    state.isLandscape = height < width;
    state.isPortrait = !state.isLandscape;
    state.guiScale = width < 1000 ? 1 : width < 1500 ? 2 : width < 2000 ? 3 : width < 3000 ? 4 : 5;
  };

  // window.addEventListener('orientationchange', async () => {
  //   console.log("orientationchange");
  //   store.dispatch('setSimple', { isLandscape: await isLandscape() });
  // });
  window.addEventListener('resize', checkDevice);
  checkDevice();

  document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });
};

init();
