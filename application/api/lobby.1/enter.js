({
  access: 'public',
  method: async ({}) => {
    domain.db.subscribe({
      name: 'lobby',
      client: context.client,
      type: 'lobby',
    });
    domain.db.broadcast({
      client: context.client,
      room: 'lobby',
      data: { lobby: domain.db.forms.lobby },
    });

    const sendData = {
      user: {},
      game: {},
    };
    for (const userId of Object.keys(domain.db.forms.lobby.__user)) {
      domain.db.subscribe({
        name: 'user-' + userId,
        client: context.client,
        type: 'lobby',
      });
      sendData.user[userId] = domain.db.data.user[userId];
    }
    for (const gameId of Object.keys(domain.db.forms.lobby.__game)) {
      domain.db.subscribe({
        name: 'game-' + gameId,
        client: context.client,
        type: 'lobby',
      });
      sendData.game[gameId] = domain.db.data.game[gameId];
    }

    //context.client.emit('db/updated', sendData);
    domain.db.broadcastData(sendData, { client: context.client });
    //domain.db.broadcast({client: context.client, room: 'lobby', data: sendData});

    return 'ok'; //domain.db.forms.lobby;
  },
});
