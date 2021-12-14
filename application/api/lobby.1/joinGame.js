({
  access: 'public',
  method: async ({ gameId }) => {
    //const game = domain.db.forms.lobby.__games.l.find(game => game._id.toString() === gameId);
    const game = domain.db.data.game[gameId];

    const freePlayer = game.playerList.find((player) => !player.ready);
    freePlayer.ready = 1;
    freePlayer.user = context.userId;

    const session = domain.db.data.session.get(context.client);
    const user = domain.db.data.user[session.userId];

    user.game = game._id;
    user.player = freePlayer._id;

    await db.mongo.updateOne('game', game._id, { $set: game });
    await db.mongo.updateOne('user', user._id, { $set: user });

    domain.db.broadcast({
      room: 'game-' + game._id,
      data: { game: { [game._id]: game } },
    });
    domain.db.broadcast({
      room: 'user-' + user._id,
      data: { user: { [user._id]: user } },
    });
    context.client.emit('session/joinGame', {
      gameId: user.game,
      playerId: user.player,
    });

    return 'ok';
  },
});
