async () => {
  //domain.db.forms.lobby.__games.l = [];
  domain.db.forms.lobby.__game = {};
  const games = await db.mongo.find('game');
  for (const game of games) {
    domain.db.data.game[game._id] = game;
    //domain.db.forms.lobby.__games.l.push( game );
    domain.db.forms.lobby.__game[game._id] = {};
  }
};
