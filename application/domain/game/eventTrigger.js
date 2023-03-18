async (game, { eventData = {} }) => {
  await game.callEventHandlers({ handler: 'eventTrigger', data: eventData });
  return { status: 'ok' };
};
