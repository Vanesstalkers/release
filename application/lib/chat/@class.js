({
  decorate: () => ({
    chat: {},
    async restoreChat() {
      const msgList = await db.mongo.find(
        'chat',
        { parent: this.storeId(), text: { $ne: null } },
        { limit: 3, sort: [['_id', -1]] }
      );
      for (const msg of msgList) this.chat[msg._id] = msg;
    },
    async updateChat({ text, user, event }) {
      const time = Date.now();
      const chatEvent = { text, event, user, time, parent: this.storeId() };
      const { _id } = await db.mongo.insertOne('chat', chatEvent);
      chatEvent._id = _id.toString();
      this.set({ chat: { [_id]: chatEvent } });
      await this.saveChanges();
      return { chatEventId: chatEvent._id };
    }
  }),
});
