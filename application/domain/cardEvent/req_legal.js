({
  config: {
    playOneTime: true,
  },
  init: function () {
    const game = this.getGame();
    const deck = game.getObjectByCode('Deck[plane]');
    const code = 1001;
    deck.addItem({
      _code: code,
      customClass: ['card-plane', 'card-event', 'card-event-req_legal'],
      zoneLinks: {},
      zoneList: [],
      portList: [{ _code: 1, left: 22.5, top: 105, direct: { bottom: true }, links: [], t: 'any', s: 'core' }],
    });
    const plane = deck.getObjectByCode(`Plane[${code}]`);
    domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
  },
});
