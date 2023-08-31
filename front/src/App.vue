<template>
  <div id="app" :class="[state.isMobile ? 'mobile-view' : '']" :current-route="$root.state.currentRoute">
    <button @click="toggleFullscreen" class="fullscreen-btn">
      <span v-if="!fullscreen">
        <font-awesome-icon icon="fa-solid fa-expand" class="fa-xl" />
        На весь экран
      </span>
      <span v-if="fullscreen">
        <font-awesome-icon icon="fa-solid fa-compress" class="fa-xl" />
        Свернуть экран
      </span>
    </button>
    <div v-if="!viewLoaded" class="error show-with-delay">
      {{ error }}
    </div>
    <div v-if="!viewLoaded" class="exit show-with-delay">
      <button v-on:click="logout">Выйти</button>
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
  data() {
    return { fullscreen: false, error: '' };
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    viewLoaded() {
      return this.$root.state.viewLoaded;
    },
  },
  methods: {
    async logout() {
      await api.action.call({ path: 'domain.lobby.api.logout' }).catch(prettyAlert);
    },
    toggleFullscreen() {
      this.fullscreen = !this.fullscreen;
      if (this.fullscreen) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    },
  },
  mounted() {
    const self = this;
    window.prettyAlert = ({ message, stack } = {}) => {
      if (message === 'Forbidden') {
        // стандартный ответ impress при доступе к запрещенному ресурсу (скорее всего нужна авторизация)
      } else {
        // alert(message);
        self.error = message;
      }
    };
    document.addEventListener('fullscreenchange', (event) => {
      if (document.fullscreenElement) self.fullscreen = true;
      else self.fullscreen = false;
    });
  },
};
</script>

<style lang="scss">
body {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: fixed;
  left: 0px;
  top: 0px;
  height: 100%;
  width: 100%;
}
#app > .exit {
  position: absolute;
  bottom: 0px;
  width: 100%;
  color: white;
  background: #cccccc80;
  padding: 20px;
  font-size: 20px;
}
#app > .exit > button {
  background: #ccc;
  border: none;
  font-size: 20px;
  padding: 4px 40px;
}
#app > .exit > button:hover {
  cursor: pointer;
  opacity: 0.8;
}
#app > .error {
  color: white;
  background: #ff000080;
  padding: 20px;
  font-size: 20px;
}

.fullscreen-btn {
  position: fixed;
  z-index: 1000;
  font-size: 10px;
  left: 170px;
  top: 10px;
  width: 110px;
  color: #f4e205;
  border-radius: 4px;
  border: 1px solid #f4e205;
  padding: 2px 0px;
  background-color: black;
  background-size: 50px;
  background-repeat: no-repeat;
  background-position: center;
  margin: auto;
  cursor: pointer;
  opacity: 1;
}
#app.mobile-view .fullscreen-btn {
  left: 70px;
}
#app[current-route='Lobby'] .fullscreen-btn {
  left: 10px;
}
.fullscreen-btn svg {
  padding-right: 4px;
}
.fullscreen-btn:hover {
  opacity: 0.7;
}

.show-with-delay {
  animation: 2s fadeIn;
  animation-fill-mode: forwards;
  visibility: hidden;
}
@keyframes fadeIn {
  99% {
    visibility: hidden;
  }
  100% {
    visibility: visible;
  }
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
button[disabled='disabled'] {
  opacity: 0.5;
}
</style>
