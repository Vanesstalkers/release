(game, { diceId }) => {
  const dice = game.getObjectById(diceId);
  const zone = dice.getParent();
  const checkItemCanBeRotated = zone.checkItemCanBeRotated();

  if (checkItemCanBeRotated) {
    dice.set({ sideList: [...dice.sideList.reverse()] });
    zone.updateValues();
  }

  return { status: 'ok' };
};
