import Vue from 'vue';
import App from './App.vue';
import router from './router';
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

const init = async () => {
  if (!window.name) window.name = Date.now() + Math.random();

  const state = {
    viewLoaded: true,
    currentUser: '',
    currentLobby: '',
    isMobile: false,
    isLandscape: true,
    isPortrait: false,
    guiScale: 1,
    currentRoute: '',
    store: {
      user: {},
    },
  };

  router.beforeEach((to, from, next) => {
    state.currentRoute = to.name;
    return next();
  });

  const mixin = {
    methods: {
      async initSession(config, handlers) {
        if (arguments.length < 2) {
          handlers = config;
          config = {};
        }
        const { login, password, demo } = config || {};
        const { success: onSuccess, error: onError } = handlers;

        const token = localStorage.getItem('smartgames.session.token');
        const session =
          (await api.action
            .public({
              path: 'lib.user.api.initSession',
              args: [
                {
                  token,
                  windowTabId: window.name,
                  login,
                  password,
                  demo,
                },
              ],
            })
            .catch((err) => {
              if (typeof onError === 'function') onError(err);
            })) || {};

        const { token: sessionToken, userId, reconnect } = session;
        if (reconnect) {
          const { workerId, ports } = reconnect;
          const port = ports[workerId.substring(1) * 1 - 1];
          location.href = `${location.origin}?port=${port}`;
          return;
        }

        if (sessionToken && sessionToken !== token) localStorage.setItem('smartgames.session.token', sessionToken);
        if (userId) {
          this.$set(this.$root.state, 'currentUser', userId);
          if (typeof onSuccess === 'function') onSuccess(session);
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
  // направление на конкретный port нужно для reconnect (см. initSession) + для отладки
  const port = new URLSearchParams(location.search).get('port') || 8800;

  // process.env.NODE_ENV = 'development' === (location.hostname === 'localhost' || location.hostname.startsWith('192.168.'))
  const url = process.env.NODE_ENV === 'development' ? `${location.hostname}:${port}` : `${location.hostname}/api`;
  const metacom = Metacom.create(`${protocol}://${url}`);
  const { api } = metacom;
  window.metacom = metacom;
  window.api = api;

  await metacom.load('db', 'session', 'action');

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
  api.session.on('logout', () => {
    app.$set(app.$root.state, 'currentUser', '');
    localStorage.removeItem('smartgames.session.token');
    router.push({ path: `/` }).catch((err) => {
      console.log(err);
    });
  });
  api.session.on('error', (data) => {
    prettyAlert(data);
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
