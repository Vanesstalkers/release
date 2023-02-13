async (game, { diceId }) => {
  const dice = game.getObjectById(diceId);
  const zone = dice.getParent();

  dice.set('deleted', false);
  zone.updateValues();

  return { status: 'ok' };
};
