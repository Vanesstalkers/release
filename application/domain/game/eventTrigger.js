(game, { eventData = {} }) => {
  game.callEventHandlers({ handler: 'eventTrigger', data: eventData });
  return { status: 'ok' };
};
