async (game, { count }) => {

  game.set('finished', true);
  //const leavePlayer = game.playerList.find(player => player._id.toString() === user.player.toString());
  //leavePlayer.looser = true;


  // for (const [client, access] of domain.db.getRoom('game-' + gameId)) {
  //   if (access.has('game')) {
  //     const session = domain.db.data.session.get(client);
  //     const user = domain.db.data.user[session.userId];
  //     user.game = null;
  //     user.player = null;
  //     await db.mongo.updateOne('user', user._id, { $set: user });
  //     domain.db.broadcast({
  //       room: 'user-' + user._id,
  //       data: { user: { [user._id]: user } },
  //     });
  //     client.emit('session/leaveGame', {});
  //   }
  // }

  return 'ok';
};
