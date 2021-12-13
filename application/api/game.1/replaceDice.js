({
  access: 'public',
  method: async ({ gameId, diceCode, zoneCode }) => {

    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(await db.mongo.findOne('game', gameId));

    const dice = game.getObjectById(diceCode);
    const zone = game.getObjectById(zoneCode);
    console.log({ game, dice, zone });
    dice.moveToTarget(zone);
    // console.log("game", game.getAllLinks());
    // console.log("zone", zone.getAllLinks());
    // console.log("player", game.getObjectByCode('Player[1]').getAllLinks());
    // console.log("playerHand", game.getObjectByCode('Player[1]').getAllLinks());
    // console.log("dice", dice, dice.getAllLinks());

    //console.log(JSON.stringify(game, '', 2));

    const $set = { ...game };
    delete $set._id;
    await db.mongo.updateOne('game', { _id: db.mongo.ObjectID(gameId) }, { $set });

    domain.db.broadcastData({
      'game': { [gameId]: game },
    });

    return { status: 'ok' };
  },
});
