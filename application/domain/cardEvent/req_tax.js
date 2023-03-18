({
  config: {
    playOneTime: true,
  },
  init: async function ({ game }) {
    const deck = game.getObjectByCode('Deck[plane]');
    const code = 1002;
    deck.addItem({
      _code: code,
      customClass: ['card-plane', 'card-event', 'card-event-req_tax'],
      zoneLinks: {},
      zoneList: [],
      portList: [{ _code: 1, left: 22.5, top: 105, direct: { bottom: true }, links: [], t: 'any', s: 'core' }],
    });
    const plane = deck.getObjectByCode(`Plane[${code}]`);
    await domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
  },
  handlers: {
    addPlane: async function ({ game, player }) {
      return { timerOverdueOff: true };
    },
    timerOverdue: async function ({ game }) {
      const availablePort = game.availablePorts[0];
      if (availablePort) await domain.game.addPlane(game, { ...availablePort });
    },
  },
});
