({
  access: 'public',
  method: async ({ gameId }) => {

    // if(context.game !== gameId)
    //   return { result: 'error', msg: 'Игрок не может совершить это действие, так как не участвует в игре' };

    const Game = domain.game.class();
    const game = new Game({_id: gameId}).fromJSON( await db.mongo.findOne('game', gameId) );
    // const game = domain.db.data.game[gameId];
    // const {proxy: game, storage} = lib.utils.addDeepProxyChangesWatcher( domain.db.data.game[gameId] );

    game.round++;
    const activePlayer = game.changeActivePlayer();

    const deck = game.getObjectByCode('Deck[domino]');
    const playerHand = activePlayer.getObjectByCode('Deck[domino]');
    const item = deck.getRandomItem();
    if(item) item.moveToTarget(playerHand);
    // console.log("game", game.getAllLinks());
    // console.log("deck", deck.getAllLinks());
    // console.log("player", playerHand.getParent().getAllLinks());
    // console.log("playerHand", playerHand.getAllLinks());
    // console.log("item", item, item.getAllLinks());
    
    const $set = {...game};
    delete $set._id;
    await db.mongo.updateOne('game', { _id: db.mongo.ObjectID(gameId) }, { $set });
    
    // console.log({storage});
    // await db.mongo.updateOne('game', {_id: db.mongo.ObjectID(gameId)}, {$set: storage});

    // for (const [client] of domain.db.getRoom( 'game-'+gameId )) {
    //   client.emit('db/smartUpdated', {'game': {[game._id]: storage}});
    // }
    // console.log("storage", lib.utils.unflatten(storage));

    domain.db.broadcastData({
      'game': { [gameId]: game },
    });

    return 'ok';
  },
});
