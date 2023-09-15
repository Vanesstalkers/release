(function () {
  const deck = this.getObjectByCode('Deck[card]');
  const deckDrop = this.getObjectByCode('Deck[card_drop]');
  for (const card of deckDrop.getObjects({ className: 'Card' })) {
    if (card.restoreAvailable()) card.moveToTarget(deck);
  }
  if (!this.isSinglePlayer()) return;

  const gamePlaneDeck = this.getObjectByCode('Deck[plane]');
  const skipArray = [];
  let plane;
  while ((plane = gamePlaneDeck.getRandomItem({ skipArray }))) {
    if (plane === null) return; // если перебор закончился, то getRandomItem вернет null

    skipArray.push(plane.id());

    this.run('showPlanePortsAvailability', { joinPlaneId: plane._id });
    if (this.availablePorts.length === 0) continue;

    const availablePortConfig = this.availablePorts[Math.floor(Math.random() * this.availablePorts.length)];
    this.run('putPlaneOnField', availablePortConfig);

    const { userId } = this.getActivePlayer();
    this.logs({
      msg: `По завершению месяца (закончилась колода карт-событий) добавлен новый блок на игровое поле.`,
      userId,
    });

    return;
  }
});
