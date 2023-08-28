(function ({ diceId }) {
  const dice = this.getObjectById(diceId);
  const zone = dice.getParent();
  const checkItemCanBeRotated = zone.checkItemCanBeRotated();

  if (checkItemCanBeRotated) {
    dice.set({ sideList: [...dice.sideList.reverse()] });
    zone.updateValues();
  }
});
