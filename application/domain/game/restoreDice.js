async (game, { diceId }) => {
  const dice = game.getObjectById(diceId);
  const zone = dice.getParent();

  dice.set('deleted', null);
  zone.updateValues();

  return { status: 'ok' };
};
