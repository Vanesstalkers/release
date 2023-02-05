(Base) =>
  class extends Base {
    addDeck(
      data,
      {
        deckClass = domain.game.Deck,
        deckListName = 'deckList',
        deckItemClass = domain.game.Dice,
      } = {}
    ) {
      if (!this[deckListName]) this[deckListName] = [];
      if (!data.settings) data.settings = {};
      data.settings.parentDeckContainer = deckListName;
      const deck = new deckClass(data, { parent: this });
      this[deckListName].push(deck);

      deck.setItemClass(deckItemClass);

      if (data.itemList?.length) {
        data.itemList.forEach((item) => deck.addItem(item));
      }

      return deck;
    }
    deleteDeck(deckToDelete) {
      deckToDelete.deleteFromParentsObjectStorage();
      const parentDeckContainer = deckToDelete.settings.parentDeckContainer;
      this[parentDeckContainer] = this[parentDeckContainer].filter(
        (deck) => deck != deckToDelete
      );
    }
  };
