<template>
  <div class="chat-form">
    <div class="chat-header">
      <select class="chat-channels" @change="setActiveChat($event)">
        <option v-for="channel of chatChannels" :key="channel.id" :value="channel.id">
          {{ channel.title }}
        </option>
      </select>
      <label class="user-list-label"> Игроки онлайн ({{ guestsCount + userList.length }})</label>
      <div class="user-list">
        <span v-if="guestsCount">Гость ({{ guestsCount }})</span>
        <span v-for="user in userList" :key="user.id" @click="openPersonalChat(user)">
          {{ user.name }}
        </span>
      </div>
    </div>
    <perfect-scrollbar class="chat-msg-list">
      <div class="msg-list">
        <div v-for="msg in getChat" :key="msg._id">
          <div v-if="msg.text" class="msg">
            <div class="header">
              <b>{{ msg.user.name }}</b>
              <i>{{ msg.timeStr }}</i>
            </div>
            {{ msg.text }}
          </div>
          <div v-if="msg.event" class="event" :time="msg.timeStr">
            Игрок <span>{{ users[msg.user.id]?.name || '' }}</span>
            {{ msg.event === 'enter' ? 'зашел в лобби' : msg.event === 'leave' ? 'вышел из лобби' : 'что-то сделал' }}
          </div>
        </div>
      </div>
    </perfect-scrollbar>
    <div class="chat-controls">
      <div v-if="!userData.name" class="chat-controls-alert">
        <div class="info">Укажите свое имя, чтобы начать писать в чат</div>
        <div class="input-group">
          <input v-model="userName" /><button @click="saveName" class="chat-btn">Сохранить</button>
        </div>
      </div>
      <textarea v-model="chatMsgText" rows="3" />
      <button :disabled="disableSendMsgBtn > 0" @click="sendChatMsg" class="chat-btn">
        <span v-if="disableSendMsgBtn > 0"> {{ disableSendMsgBtn }} </span>
        <font-awesome-icon v-if="disableSendMsgBtn === 0" :icon="['fas', 'share']" />
      </button>
    </div>
  </div>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';

export default {
  components: {
    PerfectScrollbar,
  },
  props: {
    channels: {
      type: Object,
      default() {
        return {};
      },
    },
    active: String,
    userData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  data() {
    return {
      activeChannel: this.active,
      personalChatMap: {},
      userName: '',
      chatMsgText: '',
      disableSendMsgBtn: 0,
    };
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    chatChannels() {
      return (
        Object.entries(this.channels)
          .concat(Object.entries(this.personalChatMap))
          .map(([id, channel]) => ({ id, ...channel })) || []
      );
    },
    users() {
      return this.chatChannels.find(({ id }) => id === this.activeChannel).users || {};
    },
    items() {
      return this.chatChannels.find(({ id }) => id === this.activeChannel).items || {};
    },
    userList() {
      return Object.entries(this.users)
        .filter(([id, user]) => user && user.name && user.online)
        .map(([id, user]) => Object.assign(user, { id }));
    },
    guestsCount() {
      return Object.values(this.users).filter((user) => user && !user.name && user.online).length;
    },
    getChat() {
      const items = Object.entries(this.items)
        .map(([id, msg]) =>
          Object.assign({}, msg, {
            id,
            timeStr: new Date(msg.time).toLocaleString(),
          })
        )
        .sort((a, b) => (a.time > b.time ? -1 : 1));
      return items;
    },
  },
  methods: {
    setActiveChat(event) {
      this.activeChannel = event.target.value;
    },
    openPersonalChat(user) {
      if (user.id === this.state.currentUser) return;
      if (this.personalChatMap[user.id]) return;

      this.$set(this.personalChatMap, user.id, { title: `${user.name} (лс)` });
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
          path: 'lib.chat.api.update',
          args: [{ text: this.chatMsgText, channel: this.activeChannel }],
        })
        .then((data) => {
          this.chatMsgText = '';
          this.restoreMsgBtn();
        })
        .catch((err) => {
          this.restoreMsgBtn();
        });
    },
    restoreMsgBtn() {
      if (this.disableSendMsgBtn > 0) {
        this.disableSendMsgBtn--;
        setTimeout(this.restoreMsgBtn, 1000);
      }
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss" scoped>
.chat-btn {
  background: #f4e205;
  border: 2px solid #f4e205;
  color: black;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}
.chat-btn:hover,
.chat-btn[disabled='disabled'] {
  background: black !important;
  color: #f4e205;
}

.chat-form {
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
}
.chat-header {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  border-bottom: 2px solid #f4e205;
  padding: 10px;
}
.chat-channels {
  width: 50%;
  max-width: 200px;
  margin-right: max(0px, calc(50% - 200px));
  color: #f4e205;
  background: black;
  border: 1px solid #f4e205;
}
.user-list-label {
  width: 50%;
  color: #f4e205;
  text-align: right;
  margin-bottom: 8px;
}
.user-list {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row-reverse;
}
.user-list > span {
  border: 1px solid #f4e205;
  border-radius: 2px;
  padding: 2px 4px;
  margin: 2px;
}

.chat-msg-list {
  height: 100%;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  color: white;
}

.msg-list {
  font-size: 16px;
  width: 100%;
  padding-bottom: 80px;
  padding-top: 10px;
  padding-left: 10px;
  padding-right: 10px;
}
.msg-list .msg {
  padding: 8px;
  text-align: left;
}
.msg-list .msg > .header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  font-size: 12px;
}
.msg-list .msg > .header > b {
  color: #f4e205;
}

.msg-list .event {
  padding: 8px;
  color: #f4e205;
}
.msg-list .event > span {
  color: white;
}

.chat-controls {
  position: absolute;
  width: 100%;
  display: flex;
  left: 0px;
  bottom: 0px;
  box-shadow: inset 0px -20px 20px 20px black;
}
.chat-controls-alert {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
  background: black;
  padding-top: 10px;
  margin-top: -10px;
  z-index: 2;
  box-shadow: inset 0px 0px 2px 2px #f4e205;
}
.chat-controls-alert .info {
  padding: 8px;
}
.chat-controls-alert .input-group {
  display: flex;
  justify-content: space-evenly;
}
.chat-controls-alert .input-group > input {
  border: 1px solid #f4e205;
  background: black;
  color: white;
  padding: 4px 10px;
}

.chat-controls > textarea {
  width: 100%;
  background: black;
  border: 1px solid #f4e205;
  resize: none;
  color: white;
  padding: 10px;
  margin: 10px;
  z-index: 1;
}

.chat-controls > button {
  color: #ffffff;
  width: 40px;
  height: 40px;
  margin-top: 10px;
  margin-right: 10px;
  box-shadow: black -20px 10px 20px 20px;
  z-index: 0;
}
</style>
