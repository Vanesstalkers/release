async () => {
  if (application.worker.id === 'W1') {
    console.log('test start.js');
    domain.test.data = {
      session: {},
      game: {},
      sessions: {},
      games: {},
    };

    db.mongo.afterStart.push(
      async ()=>{
        const games = await db.mongo.find('game');
        for(const game of games){
          domain.test.data.game[game._id] = game;
          domain.test.storage.game[game._id] = game;
          //domain.test.forms.lobby.__games.l.push( game );
          /* domain.db.forms.lobby.__games.l.push( {_id: game._id} ); */
        }
      }
    );
  }
};
