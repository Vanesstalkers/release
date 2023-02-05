({
  access: 'public',
  method: async ({ gameId }) => {
    // if(context.game !== gameId)
    //   return { result: 'error', msg: 'Игрок не может совершить это действие, так как не участвует в игре' };

    const game = new domain.game.class(await db.mongo.findOne('game', gameId));

    game.finished = true;
    //const leavePlayer = game.playerList.find(player => player._id.toString() === user.player.toString());
    //leavePlayer.looser = true;

    await db.mongo.updateOne('game', game._id, { $set: game });

    for (const [client, access] of domain.db.getRoom('game-' + gameId)) {
      if (access.has('game')) {
        const session = domain.db.data.session.get(client);
        const user = domain.db.data.user[session.userId];
        user.game = null;
        user.player = null;
        await db.mongo.updateOne('user', user._id, { $set: user });
        domain.db.broadcast({
          room: 'user-' + user._id,
          data: { user: { [user._id]: user } },
        });
        client.emit('session/leaveGame', {});
      }
    }
    domain.db.broadcast({
      room: 'game-' + game._id,
      data: { game: { [game._id]: game } },
    });

    return 'ok';
  },
});
