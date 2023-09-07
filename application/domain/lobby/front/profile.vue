<template>
  <div class="shown-profile" :style="{ color: 'white' }">
    <H1> Профиль игрока</H1>
    <div class="close" v-on:click.stop="closeProfile" />

    <div class="content">
      <div class="input-form">
        <div class="input-group" :style="{ flexWrap: 'wrap' }">
          <label>Логин</label>
          <input v-model="userLogin" :disabled="disableLoginInput" />
          <small v-if="!disablePasswordInput" :style="{ display: 'flex' }">
            <div>
              <label>Пароль</label>
              <input type="password" v-model="userPassword" />
            </div>
            <div>
              <label>Подтвержение</label>
              <input type="password" v-model="userPasswordConfirm" />
            </div>
          </small>
          <small>
            <button class="action-btn" @click="disableLoginInput = false">Изменить логин</button>
            <button class="action-btn" @click="toggleChangePassword">Изменить пароль</button>
          </small>
        </div>
        <br />
        <div class="input-group">
          <label>Имя</label>
          <input v-model="userName" />
        </div>
        <br />
        <div class="input-group">
          <label>Имя в телеграм</label>
          <input v-model="tgUsername" />
        </div>
        <br />
        <div class="input-group">
          <label>Пол</label>
          <div class="form_toggle">
            <div class="form_toggle-item item-1">
              <input id="fid-1" type="radio" name="gender" value="male" v-model="userGender" checked />
              <label for="fid-1">Мужской</label>
            </div>
            <div class="form_toggle-item item-2">
              <input id="fid-2" type="radio" name="gender" value="female" v-model="userGender" />
              <label for="fid-2">Женский</label>
            </div>
          </div>
        </div>
        <br />
        <div class="input-group" :style="{ flexWrap: 'wrap' }">
          <label>Описание</label>
          <textarea v-model="userInfo" :style="{ resize: 'none' }" rows="5" />
          <small> * лучше писать на английском - описание используется для генерации аватарки </small>
        </div>

        <button v-if="showSaveBtn" class="action-btn save-btn" @click="save">Сохранить</button>
      </div>
      <div
        class="avatar"
        :style="{
          backgroundImage: avatarBackgroundImage,
        }"
      >
        <div v-if="!userData.avatarCode" :style="{ paddingTop: '10px' }">Аватар не выбран</div>
        <button class="action-btn generate-btn" @click="generate" :disable="disableGenerateBtn">
          <div><font-awesome-icon :icon="['far', 'star']" /> Сгенерировать персональные аватарки</div>
          <div class="price">&#8381; 100.000</div>
        </button>
        <button class="action-btn gallery-btn" @click="showGallery">Выбрать аватар из списка</button>
        <!-- <img :style="{ maxWidth: '80%', maxHeight: '80%' }" :src="userData.generatedIconUri" /> -->
      </div>
      <div
        class="avatar-bg"
        :style="{
          backgroundImage: avatarBackgroundImage,
        }"
      />
    </div>

    <!-- {{ JSON.stringify(userData, null, 2) }} -->
  </div>
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
    userData: Object,
    closeProfile: Function,
  },
  data() {
    return {
      userLogin: this.userData.login,
      userPassword: '',
      userPasswordConfirm: '',
      userName: this.userData.name,
      tgUsername: this.userData.tgUsername,
      userGender: this.userData.gender,
      userInfo: this.userData.info,
      disableLoginInput: true,
      disablePasswordInput: true,
      disableGenerateBtn: true,
    };
  },
  watch: {
    'userData.avatars.code': function () {
      this.disableGenerateBtn = false;
      // !!! тут надо свернуть Fancybox (если открыт)
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    showSaveBtn() {
      return (
        this.userLogin != this.userData.login ||
        this.userPassword ||
        this.userName != this.userData.name ||
        this.tgUsername != this.userData.tgUsername ||
        this.userGender != this.userData.gender ||
        this.userInfo != this.userData.info
      );
    },
    avatarBackgroundImage() {
      const defaultImage = `_default/${this.userGender}_empty`;
      return `url(${this.state.serverOrigin}/img/workers/${this.userData.avatarCode || defaultImage}.png)`;
    },
  },
  methods: {
    toggleChangePassword() {
      this.disablePasswordInput = false;
      prettyAlert({ message: 'Укажи новый пароль и введи его второй раз для подтверждения' });
    },
    save() {
      prettyAlertClear();

      const updateData = {};
      if (this.userLogin != this.userData.login) {
        if (!this.userLogin) return prettyAlert({ message: 'Логин не должен быть пустым' });
        updateData.login = this.userLogin;
      }
      if (this.userPassword) {
        if (this.userPassword !== this.userPasswordConfirm)
          return prettyAlert({ message: 'Новый пароль не совпадает с подтверждением' });
        updateData.password = this.userPassword;
        this.userPassword = '';
        this.userPasswordConfirm = '';
      }
      if (this.userName != this.userData.name) updateData.name = this.userName;
      if (this.tgUsername != this.userData.tgUsername) updateData.tgUsername = this.tgUsername;
      if (this.userGender != this.userData.gender) updateData.gender = this.userGender;
      if (this.userInfo != this.userData.info) updateData.info = this.userInfo;
      if (Object.keys(updateData).length) {
        api.action
          .call({
            path: 'lib.user.api.update',
            args: [{ ...updateData }],
          })
          .then(() => {})
          .catch(prettyAlert);
      }
    },
    saveAvatar(data) {
      api.action
        .call({
          path: 'lib.user.api.update',
          args: [{ avatarCode: data.code }],
        })
        .catch(prettyAlert);
    },
    generate() {
      this.disableGenerateBtn = true;
      api.action
        .call({
          path: 'lib.user.api.generateAvatar',
          args: [],
        })
        .catch(prettyAlert);
    },
    showGallery() {
      const images = this.lobby.avatars[this.userGender].map((code) => ({ code }));
      if (this.userData.avatars?.code) {
        for (let i = 1; i <= 4; i++) {
          images.unshift({
            code: `${this.userData.avatars.code}/${i}`,
            newAvatar: true,
          });
        }
      }

      const self = this;
      new Fancybox(
        images.map((image) => ({
          ...image,
          src: `${state.serverOrigin}/img/workers/${image.code}.png`,
          type: 'image',
        })),
        {
          on: {
            choose: (slideData) => {
              self.saveAvatar(slideData);
            },
          },
          Images: {
            content: (_ref, slide) => {
              console.log('slide=', slide);
              const slideClass = slide.newAvatar ? 'new' : '';
              const slideLabel = slide.newAvatar ? '<label>Новый</label>' : '';
              return `<picture>${slideLabel}<img src="${slide.src}" class="${slideClass}" alt="" /></picture>`;
            },
          },
          Toolbar: {
            items: {
              selectBtn: {
                tpl: `<button class="f-button choose-btn">Выбрать аватар</button>`,
                click: ({ instance }) => {
                  const choose = instance.events.get('choose')[0];
                  const slideIdx = instance.carousel.page;
                  const slideData = instance.userSlides[slideIdx];
                  choose(slideData);
                },
              },
            },
            display: {
              left: [],
              middle: ['selectBtn'],
              right: ['close'],
            },
          },
        }
      );
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss" scoped>
.shown-profile {
  position: fixed !important;
  z-index: 9999;
  width: 100%;
  height: 100%;
  top: 0px;
  left: 0px;
  background-image: url(@/assets/clear-black-back.png);
}
.shown-profile > .close {
  background-image: url(@/assets/close.png);
  background-color: black;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-size: 30px;
  border-radius: 10px;
}
.shown-profile > .close:hover {
  opacity: 0.7;
}
.shown-profile h1 {
  color: #f4e205;
  text-shadow:
    var(--textshadow) 0px 0px 0px,
    var(--textshadow) 0.669131px 0.743145px 0px,
    var(--textshadow) 1.33826px 1.48629px 0px,
    var(--textshadow) 2.00739px 2.22943px 0px,
    var(--textshadow) 2.67652px 2.97258px 0px,
    var(--textshadow) 3.34565px 3.71572px 0px,
    var(--textshadow) 4.01478px 4.45887px 0px,
    var(--textshadow) 4.68391px 5.20201px 0px;
  font-family: fantasy;
  font-weight: bold;
  letter-spacing: 10px;
  padding-left: 6px;
  font-size: 2em;
  height: 5%;
}

.input-group {
  display: flex;
  justify-content: left;
}
.input-group label {
  width: 90px;
  text-align: left;
}
.input-group input,
.input-group > textarea {
  border: 1px solid #f4e205;
  background: black;
  color: white;
  padding: 4px 10px;
  width: 180px;
}
.input-group > input:disabled {
  background-color: dimgrey;
}

.input-group > small {
  display: flex;
  justify-content: space-between;
  width: 200px;
  margin-left: 90px;
  text-align: left;
  font-size: 9px;
  padding-top: 4px;
}
.input-group > small input {
  width: 70px;
  margin-right: 18px;
}
.action-btn {
  background: #f4e205;
  border: 2px solid #f4e205;
  color: black;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}
.input-group > small > .action-btn {
  height: 20px;
  padding: 2px 4px;
  font-size: 10px;
}
.action-btn:hover,
.action-btn[disabled='disabled'] {
  background: black !important;
  color: #f4e205;
}

.content {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-around;
  height: 95%;
  padding: 0px 20px;
  overflow: auto;
}

.form_toggle {
  display: inline-block;
  overflow: hidden;
}
.form_toggle-item {
  float: left;
  display: inline-block;
}
.form_toggle-item input[type='radio'] {
  display: none;
}
.form_toggle-item label {
  display: inline-block;
  padding: 4px 23px;
  border: 1px solid #f4e205;
  border-right: none;
  cursor: pointer;
  user-select: none;
  width: auto;
}
.form_toggle .item-2 label {
  border-right: 1px solid #f4e205;
}
.form_toggle .form_toggle-item input[type='radio']:checked + label {
  color: black;
  background: #f4e205;
}

.save-btn {
  display: block;
  margin-left: 200px;
  margin-top: 10px;
}

.avatar {
  position: relative;
  margin-bottom: 50px;
  background-size: cover;
  background-position: center;
  width: 100%;
  max-width: 200px;
  max-height: 300px;
  border: 2px solid #f4e205;
}
.avatar-bg {
  display: none;
  position: absolute;
  top: 0px;
  z-index: -1;
  max-width: 100%;
  max-height: 100%;
  height: 100%;
  margin-bottom: 0px;
  background-size: cover;
  background-position: center;
}
.content .input-form {
  max-width: 300px;
  min-height: 400px;
}

.avatar .gallery-btn {
  position: absolute;
  left: 0px;
  bottom: 0px;
  height: 30px;
  width: 90%;
  margin: 5%;
  font-size: 10px;
  font-weight: bold;
}

.avatar .generate-btn {
  position: absolute;
  bottom: 60px;
  margin: 0px;
  width: 90%;
  left: 5%;
  font-size: 10px;
  font-weight: bold;
  text-align: left;
  background-color: gold;
  border-color: gold;
}
.avatar .generate-btn .price {
  text-align: right;
}

#app.portrait-view {
  .content {
    flex-wrap: wrap;
  }
  .content > * {
    width: 100%;
  }
  .shown-profile h1 {
    padding: 0px 50px;
  }
  .avatar {
    background: none;
    border: none;
    margin-bottom: 0px;
    max-width: 100%;
  }
  .avatar-bg {
    display: block;
  }
  .content {
    align-items: center;
  }
  .input-form {
    padding: 20px 100%;
  }
  .content .input-form {
    background-image: url(@/assets/clear-grey-back.png);
  }
}
</style>
