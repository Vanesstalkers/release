(class Bridge extends domain.game['!GameObject'] {
  zoneMap = {};
  width = 0;
  height = 0;

  constructor(data, { parent }) {
    super(data, { col: 'bridge', parent });

    this.left = data.left;
    this.top = data.top;
    this.rotation = data.rotation || 0;
  }
});
