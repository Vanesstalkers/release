async () => {

  lib.user.mainClass = domain.lobby.user;

  if (application.worker.id === 'W1') {
    db.mongo.handlers.afterStart.push(async () => {
      const lobby = new domain.lobby.class();
      const code = 'main';
      await lobby.load({ fromDB: { query: { code } } }).catch(async (err) => {
        if (err !== 'not_found') throw err; // любая ошибка, кроме ожидаемой "not_found";
        await lobby.create({ code });
      });
    });
  }
};
