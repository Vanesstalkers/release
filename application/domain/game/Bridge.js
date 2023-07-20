(class Bridge extends lib.game.gameObject {
  zoneMap = {};
  width = 0;
  height = 0;

  constructor(data, { parent }) {
    super(data, { col: 'bridge', parent });

    this.set({
      release: data.release || false,
      left: data.left,
      top: data.top,
      rotation: data.rotation || 0,
      bridgeToCardPlane: data.bridgeToCardPlane,
    });
  }
});
