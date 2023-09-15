(class Bridge extends lib.game.GameObject {
  zoneMap = {};
  width = 0;
  height = 0;

  constructor(data, { parent }) {
    super(data, { col: 'bridge', parent });
    this.broadcastableFields(['_id', 'zoneMap', 'width', 'height', 'left', 'top', 'rotation']);

    this.set({
      release: data.release || false,
      left: data.left,
      top: data.top,
      rotation: data.rotation || 0,
      bridgeToCardPlane: data.bridgeToCardPlane,
    });
  }
});
