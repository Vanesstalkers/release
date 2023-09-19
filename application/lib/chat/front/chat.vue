<template>
  <div class="chat-form">
    <div class="chat-header">
      <select class="chat-channels" ref="selectChannel" @change="setActiveChat($event)">
        <option v-for="channel of chatChannels" :key="channel.id" :value="channel.id">
          <span v-if="channel.unreadItems">
            <span v-if="channel.unreadItems <= 9">
              {{ ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][channel.unreadItems - 1] }}
            </span>
            <span v-if="channel.unreadItems > 9"> 🔟 </span>
          </span>
          {{ channel.name }}
          <span v-if="channel.personal">
            {{ channel.online ? '🟢' : '🔴' }}
          </span>
        </option>
      </select>
      <label class="user-list-label"> Игроки онлайн ({{ guestsCount + userList.length }})</label>
      <div class="user-list">
        <span v-if="guestsCount">Гость ({{ guestsCount }})</span>
        <span v-for="user in userList" :key="user.id" @click="openPersonalChat(user)" :iam="user.iam">
          <span v-if="user.unreadItems" class="unread-items-count">
            <span v-if="user.unreadItems <= 9">
              {{ ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][user.unreadItems - 1] }}
            </span>
            <span v-if="user.unreadItems > 9"> 🔟 </span>
          </span>
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
    defActiveChannel: String,
    userData: {
      type: Object,
      default() {
        return {};
      },
    },
    isVisible: Boolean,
    hasUnreadMessages: Function,
  },
  data() {
    return {
      selectedChannel: '',
      newPersonalChatMap: {},
      userName: '',
      chatMsgText: '',
      disableSendMsgBtn: 0,
      personalUnreadItems: 0,
      lastViewTime: Date.now(),
    };
  },
  watch: {
    personalUnreadItems: function () {
      this.checkUnreadItems();
    },
    itemsCount: function () {
      this.checkUnreadItems();
    },
    isVisible: function (check) {
      if (check) {
        this.lastViewTime = Date.now();
        this.hasUnreadMessages(0 + this.personalUnreadItems);
      }
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
    personalChatList() {
      const personalChatMap = {
        ...this.newPersonalChatMap,
        ...(this.userData.personalChatMap || {}),
      };

      return Object.entries(personalChatMap).map(([id, channel]) => [
        id,
        {
          personal: true,
          online: this.lobby.users?.[id]?.online,
          name: channel.name,
          users: {
            [this.state.currentUser]: { name: this.userData.name, online: true },
            [id]: this.lobby.users?.[id] || {},
          },
          items: channel.items || {},
          unreadItems: Object.values(channel.items || {}).filter(({ time }) =>
            // для активного канала все новые сообщения не считаются unreadItems, а чтобы обновить значение lastView на сервере, при переключении канала вызовем api.loadPersonal
            this.isVisible && this.activeChannel === id
              ? 0
              : time > (this.userData.personalChatMap?.[id]?.lastView || 0)
          ).length,
        },
      ]);
    },
    chatChannels() {
      return (
        Object.entries(this.channels)
          .concat(this.personalChatList)
          .map(([id, channel]) => ({
            id,
            online: true, // все каналы по дефолту online, но персональные могут быть offline
            ...channel,
          })) || []
      ).sort((a, b) =>
        !a.personal && b.personal
          ? -1 // глобальные каналы вверху списка
          : a.inGame && !b.inGame
          ? -1 // игровые каналы вверху списка
          : a.online && !b.online
          ? -1 // онлайн каналы вверху списка
          : 1
      );
    },
    activeChannel() {
      return this.selectedChannel || this.defActiveChannel;
    },
    activeChannelData() {
      return this.chatChannels.find(({ id }) => id === this.activeChannel) || {};
    },
    users() {
      return this.activeChannelData.users || {};
    },
    items() {
      return this.activeChannelData.items || {};
    },
    itemsCount() {
      return Object.keys(this.items).length;
    },
    isPersonalChannel() {
      return this.activeChannelData.personal;
    },
    userList() {
      const users = Object.entries(this.users)
        .filter(([id, user]) => user && user.name && user.online)
        .map(([id, user]) => Object.assign(user, { id, iam: this.state.currentUser === id }))
        .filter(({ id }) => id);
      let unreadItems = 0;
      for (const [channelId, channel] of this.personalChatList) {
        const user = users.find(({ id }) => id === channelId);
        if (channel.unreadItems) {
          unreadItems++;
          if (user) user.unreadItems = channel.unreadItems;
          else users.push({ id: channelId, ...channel });
        } else {
          if (user && user.unreadItems) delete user.unreadItems;
        }
      }
      this.$set(this, 'personalUnreadItems', unreadItems);
      return users;
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
      // это пока еще старый канал - обновляем lastView на сервере, чтобы все прочитанное, пока чат был открыт, не попало в unreadItems при закрытии чата
      if (this.isPersonalChannel) {
        api.action
          .call({
            path: 'lib.chat.api.loadPersonal',
            args: [{ channelUserId: this.activeChannel }],
          })
          .catch(prettyAlert);
      }

      // переключаем канал
      this.selectedChannel = event.target.value;

      this.$nextTick(() => {
        // тут уже новый канал
        if (this.isPersonalChannel) {
          api.action
            .call({
              path: 'lib.chat.api.loadPersonal',
              args: [{ channelUserId: this.activeChannel }],
            })
            .catch(prettyAlert);
        }
      });
    },
    openPersonalChat(user) {
      if (user.id === this.state.currentUser) return;
      if (this.userData.personalChatMap?.[user.id]) {
        const $select = this.$refs.selectChannel;
        $select.value = user.id;
        $select.dispatchEvent(new Event('change'));
      } else {
        this.$set(this.newPersonalChatMap, user.id, { name: user.name });
        api.action
          .call({
            path: 'lib.chat.api.openPersonal',
            args: [{ id: user.id, name: user.name }],
          })
          .then((data) => {
            this.$nextTick(() => {
              const $select = this.$refs.selectChannel;
              $select.value = user.id;
              $select.dispatchEvent(new Event('change'));
            });
          })
          .catch((err) => {
            this.$delete(this.newPersonalChatMap, user.id);
            prettyAlert(err);
          });
      }
    },
    saveName() {
      api.action
        .call({
          path: 'lib.user.api.update',
          args: [{ name: this.userName }],
        })
        .catch(prettyAlert);
    },
    sendChatMsg() {
      this.disableSendMsgBtn = 5;
      api.action
        .call({
          path: this.isPersonalChannel ? 'lib.chat.api.updatePersonal' : 'lib.chat.api.update',
          args: [{ text: this.chatMsgText, channel: this.activeChannel }],
        })
        .then((data) => {
          this.chatMsgText = '';
          this.restoreMsgBtn();
        })
        .catch((err) => {
          this.restoreMsgBtn();
        });
      this.lastViewTime = Date.now() + 1000;
    },
    restoreMsgBtn() {
      if (this.disableSendMsgBtn > 0) {
        this.disableSendMsgBtn--;
        setTimeout(this.restoreMsgBtn, 1000);
      }
    },
    checkUnreadItems() {
      if (this.isVisible) this.lastViewTime = Date.now();
      let count = this.isPersonalChannel
        ? 0
        : this.getChat.filter(({ time, event }) => !event && time > this.lastViewTime).length;
      count += this.personalUnreadItems;
      this.hasUnreadMessages(count);
    },
  },
  async created() {},
  async mounted() {
    // !!! добавить event key Enter
  },
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
  overflow: hidden !important;
}
.chat-header {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  border-bottom: 2px solid #f4e205;
  padding: 10px;

  &.tutorial-active {
    box-shadow: inset 0 0 20px 10px #f4e205;
  }
}
.chat-channels {
  width: 50%;
  max-width: 200px;
  margin-right: max(0px, calc(50% - 200px));
  color: #f4e205;
  background: black;
  border: 1px solid #f4e205;

  &.tutorial-active {
    box-shadow: 0 0 20px 10px #f4e205;
  }
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
  > span {
    border: 1px solid #f4e205;
    border-radius: 2px;
    padding: 2px 4px;
    margin: 2px;
    cursor: pointer;
  }
  > span:not([iam]):hover {
    opacity: 0.7;
  }
  > span[iam] {
    background: #f4e205;
    color: black;
    cursor: default;
  }
}

.user-list .unread-items-count {
  font-size: 11px;
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

  &.tutorial-active {
    box-shadow: inset 0 0 20px 10px #f4e205;
  }

  .info {
    padding: 8px;
  }
  .input-group {
    display: flex;
    justify-content: center;

    input {
      width: 100px;
      border: 1px solid #f4e205;
      background: black;
      color: white;
      padding: 4px 10px;
    }
  }
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
