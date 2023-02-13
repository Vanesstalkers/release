(Base) =>
  class extends Base {
    addDeck(
      data,
      {
        deckClass = domain.game.Deck,
        deckListName = 'deckMap',
        deckItemClass = domain.game.Dice,
      } = {}
    ) {
      if (!data.settings) data.settings = {};
      data.settings.parentDeckContainer = deckListName;
      const deck = new deckClass(data, { parent: this });
      this.getGame().markNew(deck);
      if (!this[deckListName]) this.set(deckListName, {});
      this.set(deckListName, { ...this[deckListName], [deck._id]: {} });
      deck.setItemClass(deckItemClass);

      if (data.itemMap) {
        data.itemList = [];
        const store = this.getFlattenStore();
        for (const _id of Object.keys(data.itemMap)) {
          data.itemList.push(store[_id]);
        }
      }
      if (data.itemList?.length) {
        data.itemList.forEach((item) => deck.addItem(item));
      }

      return deck;
    }
    deleteDeck(deckToDelete) {
      deckToDelete.deleteFromParentsObjectStorage();
      const parentDeckContainer = deckToDelete.settings.parentDeckContainer;
      delete this[parentDeckContainer][deckToDelete._id];
      this.set(parentDeckContainer, { ...this[parentDeckContainer] });
    }
  };
