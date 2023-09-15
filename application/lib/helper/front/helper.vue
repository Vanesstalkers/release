<template>
  <div :class="['helper', inGame ? 'in-game' : '', ...helperClass]">
    <div
      v-for="link in filledHelperLinks"
      :key="link.code"
      :class="['helper-link', 'helper-avatar', link.customClass]"
      :style="{
        left: `${link.clientRect.left + (link.pos.left ? 0 : link.clientRect.width)}px`,
        top: `${link.clientRect.top + (link.pos.top ? 0 : link.clientRect.height)}px`,
      }"
      v-on:click.stop="showTutorial(link)"
    />

    <div v-if="!menu" :class="['helper-guru', 'helper-avatar', `scale-${state.guiScale}`]" v-on:click.stop="initMenu">
      <div v-if="alert" class="alert" v-on:click.stop="">
        {{ alert }}
        <div v-if="showHideAlert">
          <small>{{ hideAlert }}</small>
        </div>
        <!-- <div v-if="hideAlert" class="show-hide" v-on:click.stop="showHideAlert = true" /> -->
        <div class="close" v-on:click.stop="alert = null" />
      </div>
    </div>
    <div v-if="menu" :class="['helper-menu', `scale-${state.guiScale}`]">
      <div class="helper-avatar" />
      <div class="content">
        <div class="text">
          {{ menu.text }}
        </div>

        <ul v-if="menu.showTutorials && inGame" class="tutorials">
          <li v-on:click.stop="action({ tutorial: 'game-tutorial-start' })">Стартовое приветствие игры</li>
          <li v-on:click.stop="action({ tutorial: 'game-tutorial-gameControls' })">Управление игровым полем</li>
        </ul>
        <ul v-if="menu.showTutorials && !inGame" class="tutorials">
          <li v-on:click.stop="action({ tutorial: 'lobby-tutorial-start' })">Стартовое приветствие</li>
          <li v-on:click.stop="action({ tutorial: 'lobby-tutorial-menuGame' })">Игровая комната</li>
        </ul>

        <div v-if="menu.buttons" :class="['controls', menu.bigControls ? 'big' : '']">
          <button
            v-for="button in menu.buttons"
            :key="button.text"
            v-on:click.stop="menuAction({ action: button.action })"
          >
            {{ button.text }}
            <font-awesome-icon v-if="button.exit" :icon="['far', 'circle-xmark']" size="lg" style="color: #f4e205" />
            <font-awesome-icon
              v-if="button.action === 'leaveGame'"
              :icon="['fas', 'right-from-bracket']"
              size="lg"
              style="color: #f4e205"
            />
          </button>
        </div>
      </div>
    </div>
    <div :class="['helper-dialog', 'scroll-off', `scale-${state.guiScale}`, ...dialogClass]" :style="dialogStyle">
      <div class="helper-avatar" />
      <div :class="['content', helperData.img && helperData.text ? 'nowrap' : '']">
        <div v-if="helperData.img" class="img">
          <img :src="helperData.img" />
        </div>
        <div class="text">
          {{ helperData.text }}
        </div>
        <div class="video" />
        <div v-if="helperData.buttons" class="controls">
          <button v-for="button in helperData.buttons" :key="button.text" v-on:click.stop="action({ ...button })">
            <font-awesome-icon
              v-if="button.icon"
              :icon="button.icon"
              size="lg"
              style="color: #f4e205; padding-right: 4px"
            />
            {{ button.text }}
            <div v-if="button.exit" class="exit-icon" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'helper',
  components: {},
  props: {
    inGame: Boolean,
    showProfile: Function,
  },
  data() {
    return {
      alert: null,
      hideAlert: null,
      showHideAlert: false,
      mutationObserver: null,
      helperLinksBounds: {},
      menu: null,
      dialogActive: false,
      helperClassMap: {},
      dialogStyle: {},
      dialogClassMap: {},
      resetLinks: Date.now(),
    };
  },
  watch: {
    'helperData.text': function () {
      this.update();
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    helperData() {
      return this.state.store.user?.[this.state.currentUser]?.helper || {};
    },
    helperDialogActive() {
      return this.helperData.text || this.helperData.img ? true : false;
    },
    helperLinks() {
      return this.state.store.user?.[this.state.currentUser]?.helperLinks || {};
    },
    helperLinksEntries() {
      return Object.entries(this.helperLinks).filter(
        ([code, link]) => link.used !== true && link.type === (this.inGame ? 'game' : 'lobby')
      );
    },
    filledHelperLinks() {
      return Object.entries(this.helperLinks)
        .map(([code, link]) => ({
          code,
          pos: {},
          ...link,
          clientRect: this.helperLinksBounds[code],
        }))
        .filter(({ clientRect }) => clientRect);
    },
    helperClass() {
      return Object.entries(this.helperClassMap)
        .filter(([name, enabled]) => enabled)
        .map(([name]) => name);
    },
    dialogClass() {
      return Object.entries(this.dialogClassMap)
        .filter(([name, enabled]) => enabled)
        .map(([name]) => name);
    },
    menuData() {
      return this.helperData.menu || null;
    },
  },
  methods: {
    async update() {
      let { text, img, active, pos, superPos = false, fullscreen = false, actions, buttons } = this.helperData;
      if (!pos) pos = 'bottom-right'; // тут может быть null
      if (typeof pos === 'object') {
        if (this.state.isMobile) {
          pos = pos.mobile;
          if (typeof pos === 'object') {
            pos = this.state.isLandscape ? pos.landscape : pos.portrait;
          }
        } else pos = pos.desktop;
      }

      this.$set(this.helperClassMap, 'dialog-hidden', false);
      this.$set(this.helperClassMap, 'dialog-active', text || img ? true : false);
      this.$set(this.helperClassMap, 'fullscreen', fullscreen);
      this.$set(this.dialogClassMap, 'super-pos', false);
      document.body.removeAttribute('tutorial-active');

      const dialogStyle = {};
      const offset = this.state.isMobile ? '0px' : '20px';
      if (superPos) {
        document.body.setAttribute('tutorial-active', 1);
        this.$set(this.dialogClassMap, 'super-pos', true);
      } else if (fullscreen) {
        if (pos.includes('top'))
          Object.assign(dialogStyle, { top: offset, left: offset, width: '100%', height: '100%' });
      } else {
        pos = pos.split('-');
        if (pos.includes('top')) Object.assign(dialogStyle, { top: offset, bottom: 'auto' });
        if (pos.includes('bottom')) Object.assign(dialogStyle, { bottom: offset, top: 'auto' });
        if (pos.includes('left')) Object.assign(dialogStyle, { left: offset, right: 'auto' });
        if (pos.includes('right')) Object.assign(dialogStyle, { right: offset, left: 'auto' });
        dialogStyle['transform-origin'] = pos.join(' ');
      }
      this.dialogStyle = dialogStyle;

      let actionsData = {};
      if (actions) {
        if (actions.before) {
          actionsData = new Function('return ' + actions.before)()(this) || {};
        }
      }
      const { skipStep } = actionsData;
      if (skipStep) {
        this.$set(this.helperClassMap, 'dialog-hidden', true);
        const skipButton = buttons.find((button) => button.step);
        this.action(skipButton);
        return;
      }

      document.querySelectorAll('.tutorial-active').forEach((el) => {
        el.classList.remove('tutorial-active');
      });
      if (active) {
        if (typeof active === 'string') active = { selector: active };
        let { selector, update, customClass, style } = active;

        this.$nextTick(() => {
          // если в beforeAction проводились манипуляции с dom, то селектор отработает только в nextTick
          document.querySelectorAll(selector).forEach((el) => {
            if (el) {
              el.classList.add('tutorial-active');
              if (customClass) el.classList.add(customClass);
              if (update) {
                el.addEventListener('click', () => {
                  this.action(update);
                });
              }
            }
          });
        });
      }
    },
    async action({ action, step, tutorial, link }) {
      if (link) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = link;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
      } else {
        let { actions } = this.helperData;
        let actionsData = {};
        if (actions) {
          if (actions[action]) {
            actionsData = (await new Function('return ' + actions[action])()(this)) || {};
            const { exit = true } = actionsData;
            if (exit) action = 'exit';
          }
        }

        await api.action
          .call({
            path: 'lib.helper.api.action',
            args: [{ action, step, tutorial, isMobile: this.state.isMobile }],
          })
          .catch(prettyAlert);
        if (tutorial) this.menu = null;
      }
    },
    async initMenu() {
      if (this.inGame) {
        this.menu = {
          text: 'Чем могу помочь?',
          bigControls: true,
          buttons: [
            { text: 'Закончить игру', action: 'leaveGame' },
            { text: 'Покажи доступные обучения', action: 'tutorials' },
            { text: 'Активировать подсказки', action: 'restoreLinks' },
            { text: 'Спасибо, ничего не нужно', action: 'exit', exit: true },
          ],
        };
      } else {
        this.menu = {
          text: 'Чем могу помочь?',
          bigControls: true,
          buttons: [
            { text: 'Открой мой профиль', action: 'profile' },
            { text: 'Активировать подсказки', action: 'restoreLinks' },
            { text: 'Покажи доступные обучения', action: 'tutorials' },
            { text: 'Спасибо, ничего не нужно', action: 'exit', exit: true },
          ],
        };
      }
    },
    async menuAction({ action }) {
      switch (action) {
        case 'exit':
          this.menu = null;
          break;
        case 'init':
          this.initMenu();
          break;
        case 'profile':
          this.menu = null;
          this.showProfile();
          break;
        case 'restoreLinks':
          await api.action
            .call({
              path: 'lib.helper.api.restoreLinks',
              args: [{ inGame: this.inGame }],
            })
            .then((data) => {
              console.log('this.resetLinks');
              this.$set(this, 'resetLinks', Date.now());
            })
            .catch(prettyAlert);
          break;
        case 'tutorials':
          this.menu = {
            text: 'Нажмите на нужное обучение в списке, чтобы запустить его повторно:',
            showTutorials: true,
            buttons: [
              { text: 'Назад в меню', action: 'init' },
              { text: 'Спасибо', action: 'exit', exit: true },
            ],
          };
          break;
        case 'leaveGame':
          await api.action
            .call({
              path: 'lib.game.api.leave',
              args: [],
            })
            .catch(prettyAlert);
          break;
      }
    },
    showTutorial({ tutorial, code, simple = true }) {
      if (this.helperDialogActive) return; // другое обучение уже активировано
      if (!tutorial) return;
      api.action
        .call({
          path: 'lib.helper.api.action',
          args: [{ tutorial, step: simple ? code : undefined, usedLink: code }],
        })
        .catch(prettyAlert);
      return;
    },
    updateLinksCoordinates() {
      this.$set(
        this,
        'helperLinksBounds',
        Object.fromEntries(
          this.helperLinksEntries.map(([code, link]) => [
            code,
            this.$root.$el.querySelector(link.selector)?.getBoundingClientRect() || null,
          ])
        )
      );
    },
  },
  mounted() {
    // watch не всегда ловит обновление helperData на старте
    this.$nextTick(this.update);

    const self = this;
    window.prettyAlertClear = () => {
      this.alert = null;
      this.hideAlert = null;
    };
    window.prettyAlert = ({ message, stack } = {}, { hideTime = 5 } = {}) => {
      if (message === 'Forbidden') message += ` (попробуйте обновить страницу)`;
      self.alert = message;
      self.hideAlert = stack;
      if (self.hideAlert) this.showHideAlert = false;

      if (hideTime > 0) {
        setTimeout(() => {
          self.alert = null;
          self.hideAlert = null;
        }, hideTime * 1000);
      }
    };

    this.mutationObserver = new MutationObserver(function (mutationsList, observer) {
      self.updateLinksCoordinates();
    });
    this.mutationObserver.observe(document.querySelector('body'), {
      attributes: true,
      // attributeFilter: [/* 'markup-code',  */ 'markup-onload'],
      childList: true,
      subtree: true,
      attributeOldValue: true,
    });
    document.addEventListener('transitionend', () => {
      self.updateLinksCoordinates();
    });
  },
  async beforeDestroy() {
    this.mutationObserver.disconnect();
  },
};
</script>

<style lang="scss">
.helper-avatar {
  border-radius: 50%;
  background-image: url(./assets/helper.png);
  background-size: contain;
  border: 4px solid #f4e205;
}
.helper-guru {
  position: fixed;
  z-index: 10000 !important;
  bottom: 20px;
  left: 20px;
  width: 64px;
  height: 64px;
  cursor: pointer;
  font-size: 14px;
  transform-origin: left bottom;
}
.helper-guru > .alert {
  position: absolute;
  bottom: 110%;
  border: 4px solid #f4e205;
  background-image: url(@/assets/clear-black-back.png);
  color: white;
  font-size: 24px;
  padding: 20px 60px 20px 80px;
  min-width: 300px;
  text-align: center;
  cursor: default;
}
.helper-guru > .alert:before {
  content: '';
  position: absolute;
  left: 20px;
  top: 20px;
  width: 30px;
  height: 30px;
  background-image: url(@/assets/alert.png);
  background-size: 30px;
}
.helper-guru > .alert > .close {
  position: absolute;
  right: -10px;
  top: -10px;
  width: 20px;
  height: 20px;
  background-image: url(@/assets/close.png);
  background-size: 20px;
  background-color: black;
  cursor: pointer;
}
.helper-guru > .alert > .close:hover {
  opacity: 0.7;
}
.helper-guru > .alert > .show-hide {
  position: absolute;
  right: 15px;
  top: -10px;
  width: 20px;
  height: 20px;
  background-image: url(@/assets/info.png);
  background-size: 20px;
  background-color: black;
  border-radius: 50%;
  cursor: pointer;
}
.helper-guru.scale-1 {
  scale: 0.8;
}
.helper-guru.scale-2 {
  scale: 1;
}
.helper-guru.scale-3 {
  scale: 1.5;
}
.helper-guru.scale-4 {
  scale: 2;
}
.helper-guru.scale-5 {
  scale: 2.5;
}
.mobile-view .helper-guru {
  scale: 0.6;
}
.mobile-view .helper-guru > .alert {
  padding: 10px 10px 10px 50px;
}
.helper.in-game .helper-guru {
  top: 20px;
  bottom: auto;
  transform-origin: left top;
}
.helper.in-game .helper-guru > .alert {
  top: 110%;
  bottom: auto;
}
.helper.dialog-active > .helper-guru,
.helper.dialog-active > .helper-link {
  display: none;
}
.helper.dialog-hidden {
  display: none;
}

.helper-menu {
  position: fixed;
  display: flex;
  z-index: 10000 !important;
  width: 600px;
  left: 20px;
  bottom: 100px;
  max-width: 50%;
}
.mobile-view .helper-menu {
  bottom: 70px;
}
.mobile-view.portrait-view .helper-menu {
  max-width: 100%;
}

#lobby .helper-menu {
  transform-origin: left bottom;
}
#game .helper-menu {
  transform-origin: left top;
  top: 20px;
  bottom: auto;
}
.helper-menu.scale-1 {
  scale: 0.8;
}
.helper-menu.scale-2 {
  scale: 1;
  bottom: 140px;
}
.helper-menu.scale-3 {
  scale: 1.5;
  bottom: 200px;
}
.helper-menu.scale-4 {
  scale: 2;
  bottom: 250px;
}
.helper-menu.scale-5 {
  scale: 2.5;
  bottom: 380px;
}
.mobile-view .helper-menu {
  scale: 1;
  left: 0px;
}
.helper.in-game .helper-menu {
  left: 0px;
  right: auto;
}

.helper-menu > .content > .tutorials {
  margin-bottom: 0px;
}
.helper-menu > .content > .tutorials > * {
  cursor: pointer;
  padding: 0px 20px;
  text-align: left;
  padding-bottom: 6px;
}
.helper-menu > .content > .tutorials > *:hover {
  opacity: 0.7;
}

.helper-dialog {
  display: none;
  position: fixed;
  z-index: 10001 !important;
  width: 600px;
  max-width: 100%;
  max-height: 95%;
}
.helper-dialog.super-pos {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.helper-dialog.scale-1 {
  scale: 0.8;
}
.helper-dialog.scale-1.super-pos {
  transform: translate(-60%, -60%);
}
.helper-dialog.scale-2 {
  scale: 1;
}
.helper-dialog.scale-3 {
  scale: 1.5;
}
.helper-dialog.scale-3.super-pos {
  transform: translate(-30%, -30%);
}
.helper-dialog.scale-4 {
  scale: 2;
}
.helper-dialog.scale-4.super-pos {
  transform: translate(-25%, -25%);
}
.helper-dialog.scale-5 {
  scale: 2.5;
}
.helper-dialog.scale-5.super-pos {
  transform: translate(-20%, -20%);
}

.mobile-view .helper-dialog {
  scale: 1;
}
.mobile-view .helper-dialog.super-pos {
  transform: translate(-50%, -50%);
}

.helper.dialog-active > .helper-dialog {
  display: flex;
}
.helper-dialog > .content,
.helper-menu > .content {
  width: 100%;
  margin: 30px;
  min-height: 100px;
  border: 2px solid #f4e205;
  background-image: url(@/assets/clear-black-back.png);
  padding: 20px;
  padding-right: 60px;
  white-space: pre-wrap;
  color: #f4e205;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
}
.mobile-view .helper-dialog > .content,
.mobile-view .helper-menu > .content {
  font-size: 10px;
  padding: 10px 20px 14px 10px;
  min-height: 40px;
  background: black;
}
.helper-dialog > .content.nowrap,
.helper-menu > .content.nowrap {
  flex-wrap: nowrap;
}
.helper-menu > .content {
  min-height: 50px;
}
.mobile-view.landscape-view .helper-dialog {
  max-width: 50%;
}

.helper-dialog > .content > .text {
  width: 100%;
}

.helper-dialog > .content > .controls,
.helper-menu > .content > .controls {
  position: absolute;
  bottom: 6px;
  left: 0px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.helper-dialog > .content > .controls.big,
.helper-menu > .content > .controls.big {
  top: 100%;
  flex-wrap: wrap;
  margin-top: -40px;
}
.helper-dialog > .content > .controls > button,
.helper-menu > .content > .controls > button {
  border-color: #f4e205;
  color: #f4e205;
  background-image: url(@/assets/clear-black-back.png);
  padding: 10px 20px;
  display: flex;
  justify-content: center;
  cursor: pointer;
}

.mobile-view .helper-dialog > .content > .controls > button,
.mobile-view .helper-menu > .content > .controls > button {
  padding: 4px 10px;
  font-size: 10px;
}

.helper-dialog > .content > .controls.big > button,
.helper-menu > .content > .controls.big > button {
  width: 60%;
}
.helper-dialog > .content > .controls > button:hover,
.helper-menu > .content > .controls > button:hover {
  color: white;
}
.helper-dialog > .content > .controls.big > button > svg,
.helper-menu > .content > .controls.big > button > svg {
  margin-left: 4px;
}
.helper-dialog > .helper-avatar,
.helper-menu > .helper-avatar {
  position: absolute;
  z-index: 10001 !important;
  border-radius: 50%;
  border: 3px solid #f4e205;
  right: 10px;
  top: 10px;
  width: 64px;
  height: 64px;
}
.mobile-view .helper-dialog > .helper-avatar,
.mobile-view .helper-menu > .helper-avatar {
  width: 40px;
  height: 40px;
}

body[tutorial-active] #app:after {
  content: '';
  position: fixed !important;
  z-index: 9999;
  width: 100%;
  height: 100%;
  top: 0px;
  left: 0px;
  background-image: url(@/assets/clear-grey-back.png);
}
.tutorial-active {
  z-index: 10000 !important;
  position: relative;
  box-shadow: 0 0 100px 10px #f4e205;
}
.tutorial-active.rounded {
  box-shadow: 0 0 20px 20px #f4e205;
  border-radius: 50%;
}

.helper.fullscreen {
  width: 100%;
  display: flex;
  justify-content: center;
}
.helper.fullscreen .helper-dialog {
  width: auto !important;
}

.helper-link {
  position: fixed;
  width: 50px;
  height: 50px;
  margin-left: -25px;
  margin-top: -25px;
  z-index: 2;
  cursor: pointer;
  box-shadow: 0 0 10px 10px #f4e205;
}
.helper-link:hover {
  opacity: 0.7;
}
.mobile-view .helper-link {
  width: 30px;
  height: 30px;
}
</style>
