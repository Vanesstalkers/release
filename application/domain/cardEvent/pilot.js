({
  config: {
    playOneTime: true,
  },
  init: async function ({ game, player }) {
    const gameDeck = game.getObjectByCode('Deck[plane]');
    const deck = player.getObjectByCode('Deck[plane]');

    for (let i = 0; i < 2; i++) {
      const plane = gameDeck.getRandomItem();
      if (plane) plane.moveToTarget(deck);
    }
  },
  handlers: {
    addPlane: async function ({ game, player }) {
      const gameDeck = game.getObjectByCode('Deck[plane]');
      const deck = player.getObjectByCode('Deck[plane]');
      const itemIds = Object.keys(deck.itemMap);
      for (const itemId of itemIds) {
        game.getStore().plane[itemId].moveToTarget(gameDeck);
      }
      return { timerOverdueOff: true };
    },
    endRound: async function ({ game }) {
      const player = game.getActivePlayer();
      if (!game.availablePorts.length) {
        const planeDeck = player.getObjectByCode('Deck[plane]');
        const plane = planeDeck.getObjects({ className: 'Plane' })[0];
        if (plane) await domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
      }
      const availablePort = game.availablePorts[0];
      if (availablePort) await domain.game.addPlane(game, { ...availablePort });
      await domain.cardEvent['pilot'].handlers.addPlane({ game, player });
    },
    timerOverdue: async function ({ game }) {
      await domain.cardEvent['pilot'].handlers.endRound({ game });
    },
  },
});
