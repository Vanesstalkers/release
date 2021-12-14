async ({ gameId, userId }) => {
  const query = { _id: db.mongo.ObjectID(gameId) };
  const game = await db.mongo.findOne('game', query);

  const freePlayer = game.playerList.find((player) => !player.ready);
  freePlayer.ready = 1;
  freePlayer.user = userId;

  await db.mongo.updateOne('game', query, { $set: game });

  return { result: 'success', playerId: freePlayer._id };
};
