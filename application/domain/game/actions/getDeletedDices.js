(function () {
  const result = [];
  for (const zone of this.getObjects({ className: 'Zone' })) {
    result.push(...zone.getObjects({ className: 'Dice' }).filter((dice) => dice.deleted));
  }
  return result;
});
