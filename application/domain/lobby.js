({
  subscribers: new Map(),

  subscribe({ client }) {
    if (!this.subscribers.has(client)) {
      this.subscribers.set(client, {});
    }
    // if (!client.broadcastRooms.has(this.subscribers)) {
    //   client.broadcastRooms.add(this.subscribers);
    // }
  },
  unsubscribe({ client }) {
    if (this.subscribers.has(client)) {
      this.subscribers.delete(client);
    }
  },
  broadcast({ event, data }) {
    for (const [client] of this.subscribers) {
      client.emit('lobby/event', { event, data });

      switch (event) {
      case 'userJoin':
        domain.db.subscribe({
          name: 'user-' + data._id,
          client,
          type: 'lobby',
        });
        client.emit('db/updated', { user: { [data._id]: data } });
        break;
      case 'userLeave':
        domain.db.unsubscribe({ name: 'user-' + data._id, client });
        break;
      }
    }
  },
});
