(class Game {
  constructor() {
    console.log('class Game');
  }
})

/* ({
  list: new Map(),
  gameRooms: new Map(),

  start () {
    console.log("game async start () {");
  },

  async newGame () {

    const game = {
      add_time: Date.now(),
      round: 1,
      playerList : [
        {
            "_id" : 1,
            active: true,
            diceList : [],
        },
        {
            "_id" : 2,
            diceList : [],
        },
        {
            "_id" : 3,
            diceList : [],
        }
      ]
    };
    const insertOne = await db.mongo.insertOne('game', game);
    game._id = insertOne._id;

    //domain.game.list.set(game._id.toString(), game);
    // domain.game.gameRooms.set(game._id.toString(), new Set());

    return { result: 'success', gameId: game._id };
  },

  async joinGame  ({ gameId, userId }) {

    const query = {_id: db.mongo.ObjectID(gameId)};
    const game = await db.mongo.findOne('game', query);

    const freePlayer = game.playerList.find(player => !player.ready);
    freePlayer.ready = 1;
    freePlayer.user = userId;

    await db.mongo.updateOne('game', query, {$set: game});

    const games = await db.mongo.find('game');

    for (const client of domain.db.getRoom( 'lobby' )) {
      client.emit('db/updated', {_id: 'lobby', games});
    }

    return { result: 'success', playerId: freePlayer._id };
  },
});
 */