import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  state: {
    store: {},
    pickedDiceId: null,
    selectedDiceSideId: null,
    availablePorts: [],
    helperLinksBounds: {},
    shownCard: null,
    selectedCard: null,
  },
  getters: {
    isMobile: (state) => state.isMobile,
    guiScale: (state) => state.guiScale,
    isLandscape: (state) => state.isLandscape,
    isPortrait: (state) => !state.isLandscape,
    currentUser: (state) => state.currentUser,
    sessionPlayerId: (state) => state.sessionPlayerId,
    sessionPlayerIsActive: (state) =>
      state.sessionPlayerId ===
      Object.keys((state.store.game?.[state.gameId] || {}).playerMap || {}).find(
        (id) => state.store.player?.[id]?.active
      ),
    currentRound: (state) => (state.store.game?.[state.gameId] || {}).round,
    actionsDisabled: (state) => state.store.player?.[state.sessionPlayerId]?.eventData?.actionsDisabled,
    pickedDiceId: (state) => state.pickedDiceId,
    selectedDiceSideId: (state) => state.selectedDiceSideId,
    availablePorts: (state) => state.availablePorts,
    helperLinksBounds: (state) => state.helperLinksBounds,
    shownCard: (state) => state.shownCard,
    selectedCard: (state) => state.selectedCard,

    getSimple: (state) => (id, col) => {
      return (col ? state[col]?.[id] : state[id]) || {};
    },
    getStore: (state) => (id, col) => {
      return (col ? state.store[col]?.[id] : state.store[id]) || {};
    },
    getClone: (state) => (id, col) => {
      return JSON.parse(JSON.stringify((col ? state[col]?.[id] : state[id]) || {}));
    },
    getState: (state) => {
      return state;
    },
    gamePlaneCustomStyleData: (state) => state.gamePlaneCustomStyleData || {},
    getHelperLinks: (state, getters) => {
      const links = getters.getStore(getters.currentUser, 'user').helperLinks || {};
      const currentGame = localStorage.getItem('currentGame');
      return Object.fromEntries(
        Object.entries(links).filter(
          ([code, link]) => link.used !== true && link.type === (currentGame ? 'game' : 'lobby')
        )
      );
    },
  },
  mutations: {
    setPickedDiceId: (state, value) => {
      state.pickedDiceId = value;
    },
    setSelectedDiceSideId: (state, value) => {
      state.selectedDiceSideId = value;
    },
    hideZonesAvailability: (state) => {
      Object.keys(state.store.zone).forEach((id) => {
        if (state.store.zone[id].available) state.store.zone[id].available = false;
      });
    },
    setAvailablePorts: (state, value) => {
      state.availablePorts = value;
    },
    setShownCard: (state, value) => {
      state.shownCard = value;
    },
    setSelectedCard: (state, value) => {
      state.selectedCard = value;
    },

    clearData: (state) => {
      Vue.set(state, 'forms', {});
      Vue.set(state, 'session', {});
      Vue.set(state, 'game', {});
      console.log('clearData end');
    },
    setSimple: (state, value) => {
      Object.entries(value).forEach(([key, val]) => {
        Vue.set(state, key, val);
      });
    },
    setData: (state, value) => {
      Object.entries(value).forEach(([key, val]) => {
        if (!state[key]) Vue.set(state, key, {});
        Object.keys(val).forEach((id) => {
          Vue.set(state[key], id, val[id]);
        });
      });
    },
    setDeep: (state, value) => {
      Object.entries(value).forEach(([key, val]) => {
        if (!state[key]) Vue.set(state, key, {});
        Object.keys(val).forEach((id) => {
          Object.entries(val[id]).forEach(([k, v]) => {
            const props = k.split('.');
            if (!state[key][id]) Vue.set(state[key], id, {});
            let itemPart = state[key][id];
            for (let i = 0; i < props.length - 1; i++) {
              if (!itemPart[props[i]]) Vue.set(itemPart, props[i], {});
              itemPart = itemPart[props[i]];
            }
            Vue.set(itemPart, props[props.length - 1], v);
          });
        });
      });
    },
    setStore: (state, value) => {
      const store = state.store;
      Object.entries(value).forEach(([key, val]) => {
        if (!store[key]) store[key] = {};
        Object.keys(val).forEach((id) => {
          const flattenObj = flatten(val[id]);
          Object.entries(flattenObj).forEach(([k, v]) => {
            const props = k.split('.');
            if (!store[key][id]) store[key][id] = {};
            let itemPart = store[key][id];
            for (let i = 0; i < props.length - 1; i++) {
              if (!itemPart[props[i]]) Vue.set(itemPart, props[i], {});
              itemPart = itemPart[props[i]];
            }
            Vue.set(itemPart, props[props.length - 1], v);
          });
        });
      });
      Vue.set(state, 'store', { ...store });

      function isPlainObj(value) {
        return value?.constructor?.prototype?.hasOwnProperty('isPrototypeOf');
      }
      function flatten(obj, keys = []) {
        const acc = {};
        const objKeys = Object.keys(obj);

        // для пустых объектов нужно добавлять baseKey, а для всех остальных нельзя, потому что теряются вложенные атрибуты (объект перетирается)
        const baseKey = Object.values(keys).join('.');
        if (objKeys.length === 0 && baseKey) acc[baseKey] = {};
        return objKeys.reduce((acc, key) => {
          return Object.assign(
            acc,
            isPlainObj(obj[key]) ? flatten(obj[key], keys.concat(key)) : { [keys.concat(key).join('.')]: obj[key] }
          );
        }, acc);
      }
    },
  },
  actions: {
    async setSimple({ state, commit, dispatch }, options = {}) {
      commit('setSimple', options);
    },
    async setData({ state, commit, dispatch }, options = {}) {
      commit('setData', options);
    },
    async setDeep({ state, commit, dispatch }, options = {}) {
      commit('setDeep', options);
    },
    async setStore({ state, commit, dispatch }, options = {}) {
      commit('setStore', options);
    },
  },
  modules: {},
});
