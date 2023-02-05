(class Bridge extends domain.game['!GameObject'] {
  zoneList = [];
  width = 0;
  height = 0;

  constructor(data, { parent }) {
    super(data, { parent });

    this.left = data.left;
    this.top = data.top;
    this.rotation = data.rotation || 0;
  }
});
