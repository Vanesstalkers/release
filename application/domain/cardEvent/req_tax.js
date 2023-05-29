({
  config: {
    playOneTime: true,
  },
  init: async function ({ game }) {
    const deck = game.getObjectByCode('Deck[plane]');
    const code = 'event_req_tax';
    deck.addItem({
      _code: code,
      release: true,
      customClass: ['card-plane', 'card-event', 'card-event-req_tax'],
      zoneLinks: {},
      zoneList: [],
      portList: [{ _code: 1, left: 22.5, top: 105, direct: { bottom: true }, links: [], t: 'any', s: 'core' }],
    });
    const plane = deck.getObjectByCode(`Plane[${code}]`);
    await domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
    if (game.availablePorts.length) game.set('activeEvent', { sourceId: this._id });
  },
  handlers: {
    addPlane: async function ({ game, player }) {
      game.set('activeEvent', null);
      return { timerOverdueOff: true };
    },
    timerOverdue: async function ({ game }) {
      if (!game.availablePorts) {
        const plane = game.getObjectByCode('Plane[event_req_tax]');
        await domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
      }
      const availablePort = game.availablePorts[0];
      if (availablePort) await domain.game.addPlane(game, { ...availablePort });
    },
  },
});
