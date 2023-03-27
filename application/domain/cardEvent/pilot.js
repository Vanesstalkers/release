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
      // не всегда срабатывает сброс руки
      for (const itemId of itemIds) {
        game.getStore().plane[itemId].moveToTarget(gameDeck);
      }
      return { timerOverdueOff: true };
    },
    timerOverdue: async function ({ game }) {
      if (!game.availablePorts) {
        const player = game.getActivePlayer();
        const plane = player.getObjectByCode('Deck[plane]').getObjects({ className: 'Plane' })[0];
        await domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
      }
      const availablePort = game.availablePorts[0];
      if (availablePort) await domain.game.addPlane(game, { ...availablePort });
    },
  },
});
