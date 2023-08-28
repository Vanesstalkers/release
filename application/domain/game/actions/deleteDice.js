(function ({ diceId }) {
  const dice = this.getObjectById(diceId);
  const zone = dice.getParent();

  if (dice.placedAtRound === this.round) throw new Error('Запрещено менять костяшки, размещенные на текущем ходу.');

  dice.set({ deleted: true });
  zone.updateValues();

  return { status: 'ok' };
});
