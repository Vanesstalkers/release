async () => {
  if (application.worker.id === 'W1') {
    db.mongo.handlers.afterStart.push(async () => {
      await new domain.lobby.class({ id: 'main' }).load();
    });
  }
};
