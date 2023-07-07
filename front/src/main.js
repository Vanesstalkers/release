import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { Metacom } from '../lib/metacom.js';

library.add(fas, far, fab);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.config.productionTip = false;
window.vuex = store;

const init = async () => {
  if (!window.name) window.name = Date.now() + Math.random();

  router.beforeEach((to, from, next) => {
    const currentGame = localStorage.getItem('currentGame');
    store.commit('setSimple', { store: {} });
    if (to.name === 'Game') {
      if (!currentGame) return next({ name: 'Lobby' });
    } else {
      if (currentGame) return next({ name: 'Game', params: { id: currentGame } });
    }
    return next();
  });

  const state = {
    store: {},
  };
  window.app = new Vue({
    router,
    store,
    data: { state },
    render: function (h) {
      return h(App);
    },
  });

  const protocol = location.protocol === 'http:' ? 'ws' : 'wss';
  const port = new URLSearchParams(location.search).get('port') || 8800;
  const url = location.hostname === 'localhost' ? `localhost:${port}` : `${location.hostname}/api`;
  const metacom = Metacom.create(`${protocol}://${url}`);
  const { api } = metacom;
  window.api = api;

  await metacom.load('auth', 'lobby', 'game', 'helper', 'db', 'session', 'user', 'action');

  api.db.on('updated', (data) => {
    store.dispatch('setData', data);
  });
  api.db.on('smartUpdated', (data) => {
    mergeDeep({ target: state.store, source: data });
    state.lastUpdate = Date.now();
  });

  api.session.on('joinGame', (data) => {
    localStorage.setItem('currentGame', data.gameId);
    store.dispatch('setSimple', { sessionPlayerId: data.playerId });
    router.push({ path: `/game/${data.gameId}` });
  });
  api.session.on('leaveGame', () => {
    localStorage.removeItem('currentGame');
    router.push({ path: `/` });
  });

  localStorage.removeItem('currentGame');
  const token = localStorage.getItem('metarhia.session.token');
  const session = await api.auth.initSession({ token, windowTabId: window.name, demo: true });

  const { token: sessionToken, userId, reconnect } = session;
  if (reconnect) {
    const { workerId, ports } = reconnect;
    const port = ports[workerId.substring(1) * 1 - 1];
    location.href = `${location.origin}?port=${port}`;
    return;
  }

  if (!sessionToken) throw new Error('Ошибка инициализации сессии');
  if (token !== sessionToken) localStorage.setItem('metarhia.session.token', sessionToken);
  if (userId) state.currentUser = userId;

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
    state.guiScale = width < 1000 ? 1 : width < 1500 ? 2 : width < 2000 ? 3 : width < 3000 ? 4 : 5;
  };

  // window.addEventListener('orientationchange', async () => {
  //   console.log("orientationchange");
  //   store.dispatch('setSimple', { isLandscape: await isLandscape() });
  // });
  window.addEventListener('resize', checkDevice);
  checkDevice();

  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('active-event')) {
      await api.game.action({
        name: 'eventTrigger',
        data: { eventData: { targetId: event.target.attributes.id?.value } },
      });
    }
  });

  new MutationObserver(function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
      } else if (mutation.type === 'attributes') {
        if (mutation.attributeName === 'markup-code') {
          // console.log('mutation', { code: mutation.target.getAttribute('markup-code'), mutation });
        }
        if (mutation.attributeName === 'markup-onload') {
          const funcName = mutation.target.getAttribute('markup-onload');
          if (window[funcName]) window[funcName](mutation.target);
        }
      }
    }

    store.dispatch('setSimple', {
      helperLinksBounds: Object.fromEntries(
        Object.entries(store.getters.getHelperLinks).map(([code, link]) => [
          code,
          window.app.$el.querySelector(link.selector)?.getBoundingClientRect() || null,
        ])
      ),
    });
  }).observe(document.querySelector('body'), {
    attributes: true,
    // attributeFilter: [/* 'markup-code',  */ 'markup-onload'],
    childList: true,
    subtree: true,
    attributeOldValue: true,
  });
};

init();
