(game, { eventData = {} }) => {
  game.emitCardEvents('eventTrigger', eventData);
  return { status: 'ok' };
};
