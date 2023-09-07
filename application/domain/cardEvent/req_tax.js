({
  config: {
    playOneTime: true,
  },
  init: function ({ game }) {
    const deck = game.getObjectByCode('Deck[plane]');
    const code = 'event_req_tax';
    deck.addItem({
      _code: code,
      price: 50,
      release: true,
      customClass: ['card-plane', 'card-event', 'card-event-req_tax'],
      zoneLinks: {},
      zoneList: [],
      portList: [{ _code: 1, left: 22.5, top: 105, direct: { bottom: true }, links: [], t: 'any', s: 'core' }],
    });
    const plane = deck.getObjectByCode(`Plane[${code}]`);
    game.run('showPlanePortsAvailability', { joinPlaneId: plane._id });
    if (game.availablePorts.length) game.set({ activeEvent: { sourceId: this._id } });
  },
  handlers: {
    addPlane: function ({ game, player }) {
      game.set({ activeEvent: null });
      return { timerOverdueOff: true };
    },
    timerOverdue: function ({ game }) {
      if (!game.availablePorts) {
        const plane = game.getObjectByCode('Plane[event_req_tax]');
        game.run('showPlanePortsAvailability', { joinPlaneId: plane._id });
      }
      const availablePortConfig = game.availablePorts[0];
      if (availablePortConfig) game.run('putPlaneOnField', availablePortConfig);
    },
  },
});
