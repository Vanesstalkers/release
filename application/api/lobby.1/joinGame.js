({
  access: 'public',
  method: async ({ gameId }) => {
    const game = domain.db.data.game[gameId];

    const player = game.getFreePlayerSlot();
    player.set('ready', true);
    player.set('user', context.userId);
    game.assign('broadcastUserList', { [context.userId]: { playerId: player._id } });

    const session = domain.db.data.session.get(context.client);
    const user = domain.db.data.user[session.userId];
    user.game = game._id;
    user.player = player._id;
    context.game = game._id;
    context.player = player._id;

    const deck = game.getObjectByCode('Deck[domino]');
    const playerHand = player.getObjectByCode('Deck[domino]');
    deck.moveRandomItems({ count: game.settings.playerHandStart, target: playerHand });

    // const deckCard = game.getObjectByCode('Deck[card]');
    // const playerHandCard = player.getObjectByCode('Deck[card]');
    // deckCard.moveRandomItems({ count: 3, target: playerHandCard });

    const $set = { ...game };
    delete $set._id;
    await db.mongo.updateOne('game', game._id, { $set });
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
