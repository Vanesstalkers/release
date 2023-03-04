(Base) =>
  class extends Base {
    addDeck(data, { deckClass = domain.game.Deck, deckListName = 'deckMap', deckItemClass = domain.game.Dice } = {}) {
      if (!data.settings) data.settings = {};
      if(!data.access) data.access = {};
      data.settings.parentDeckContainer = deckListName;

      const deck = new deckClass(data, { parent: this });
      this.getGame().markNew(deck);
      this.assign(deckListName, { [deck._id]: {} });
      deck.setItemClass(deckItemClass);

      if (data.itemMap) {
        data.itemList = [];
        const store = this.getFlattenStore();
        for (const _id of Object.keys(data.itemMap)) data.itemList.push(store[_id]);
      }
      for (const item of data.itemList || []) deck.addItem(item);

      return deck;
    }
    deleteDeck(deckToDelete) {
      deckToDelete.deleteFromParentsObjectStorage();
      const { parentDeckContainer } = deckToDelete.settings;
      this.delete(parentDeckContainer, deckToDelete._id);
    }
  };
