({
  rooms: new Map(),
  subscribers: new Map(),
  forms: {
    lobby: {
      __user: {},
      __game: {},
      __games: { col: 'game', l: [] },
    },
  },
  data: {
    session: new Map(),
    user: {},
    game: {},
    sessions: {},
    games: {},
  },
  dataAccessFilters: {
    game: {
      lobby: (data) => {
        const result = {
          _id: data._id,
          playerList: data.playerList,
          round: data.round,
        };
        return result;
      },
      game: (data, client) => {
        const session = domain.db.data.session.get(client);
        const user = domain.db.data.user[session.userId];

        const playerList = data.playerList.filter(
          (player) => player._id.toString() !== user.player.toString()
        );
        playerList.forEach((player) => {
          player.deckList.forEach((deck) => {
            deck.itemList = new Array(deck.itemList.length).fill({
              _id: '???',
            });
          });
        });

        // console.log('dataAccessFilters game->game', {
        //   data,
        //   client,
        //   session,
        //   user,
        //   playerList,
        // });
        return data;
      },
    },
  },

  subscribe({ name, client, type }) {
    const room = domain.db.getRoom(name);
    const subscriber = domain.db.getSubscriber(client);
    if (!room.has(client)) {
      room.set(client, new Set());
      //subscriber.add(name);
      subscriber.set(name, new Set());
    }
    if (type) room.get(client).add(type);
  },
  unsubscribe({ roomName, client, accessType }) {
    const room = domain.db.getRoom(roomName);
    const subscriber = domain.db.getSubscriber(client);
    if (room.has(client)) {
      if (accessType) {
        room.get(client).delete(accessType);
        subscriber.get(roomName).delete(accessType);
        if (!room.get(client).size) {
          room.delete(client);
          subscriber.delete(roomName);
        }
      } else {
        room.delete(client);
        subscriber.delete(roomName);
      }
      if (!room.size) domain.db.deleteRoom(roomName);
    }
  },
  send({ client, data, event }) {
    client.emit('db/updated', data);
    if (typeof event === 'function') event({ client });
  },
  broadcastData(data, { client: singleClient } = {}) {
    const clients = new Map();
    for (const col of Object.keys(data)) {
      for (const id of Object.keys(data[col])) {
        const room = domain.db.getRoom([col, id].join('-'));
        for (const [client, access] of room) {
          if (!singleClient || singleClient === client) {
            if (!clients.has(client)) clients.set(client, new Set());
            clients.get(client).add({ col, id, access });
          }
        }
      }
    }
    clients.forEach((items, client) => {
      const sendData = {};
      for (const item of items) {
        if (!sendData[item.col]) sendData[item.col] = {};
        sendData[item.col][item.id] = data[item.col][item.id];
        if (item.access.size) {
          for (const access of item.access) {
            const filter = domain.db.dataAccessFilters[item.col]?.[access];
            if (filter) {
              sendData[item.col][item.id] = filter(
                JSON.parse(JSON.stringify(data[item.col][item.id])),
                client
              );
            }
          }
        }
      }
      //console.log({ items, client, sendData });
      client.emit('db/updated', sendData);
    });
  },
  broadcast({ room: roomName, client: singleClient, data, event, smart = false }) {
    const room = domain.db.getRoom(roomName);
    for (const [client] of room) {
      if (!singleClient || singleClient === client) {
        client.emit(smart ? 'db/smartUpdated' : 'db/updated', data);
        if (typeof event === 'function') event({ client });
      }
    }
  },

  getRoom(name) {
    let room = domain.db.rooms.get(name);
    if (room) return room;
    room = new Map();
    domain.db.rooms.set(name, room);
    return room;
  },
  deleteRoom(name) {
    if (domain.db.rooms.has(name)) {
      domain.db.rooms.delete(name);
    }
  },

  getSubscriber(client) {
    let subscriber = domain.db.subscribers.get(client);
    if (subscriber) return subscriber;
    //subscriber = new Set();
    subscriber = new Map();
    domain.db.subscribers.set(client, subscriber);
    return subscriber;
  },
  updateSubscriberRooms({ client, accessType }) {
    const subscriber = domain.db.getSubscriber(client);
    for (const [roomName] of subscriber) {
      domain.db.unsubscribe({ roomName, client, accessType });
    }
    if (!subscriber.size) domain.db.subscribers.delete(client);
  },

  // async getData(name) {
  //   const [col, id] = name.split('-');
  //   let data = domain.db.data[col][id];
  //   if (data) return { [col]: [data] };
  //   data = await db.mongo.findOne(col, id);
  //   domain.db.data[col][id] = data;
  //   return { [col]: [data] };
  // },
});
