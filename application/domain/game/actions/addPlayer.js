(function (data) {
  const store = this.getStore();
  const player = new domain.game.Player(data, { parent: this });
  this.set({ playerMap: { [player._id]: {} } });

  if (data.deckMap) {
    data.deckList = [];
    for (const _id of Object.keys(data.deckMap)) data.deckList.push(store.deck[_id]);
  }
  for (const item of data.deckList || []) {
    const deckItemClass =
      item.type === 'domino' ? domain.game.Dice : item.type === 'plane' ? domain.game.Plane : domain.game.Card;
    item.access = { [player._id]: {} };
    player.addDeck(item, { deckItemClass });
  }
});
