(class Player extends lib.game.objects.Player {
  constructor(data, { parent }) {
    super(data, { parent });
    this.broadcastableFields(
      this.broadcastableFields().concat(
        // добавляем недостающие поля
        ['availableZones']
      )
    );

    this.set({
      availableZones: [],
    });
  }
  prepareBroadcastData({ data, player, viewerMode }) {
    const bFields = this.broadcastableFields();
    let visibleId = this._id;
    let preparedData;
    if (!bFields) {
      preparedData = data;
    } else {
      preparedData = {};
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) {
          if (key === 'availableZones' && player !== this) continue;
          preparedData[key] = value;
        }
      }
    }
    return { visibleId, preparedData };
  }
});
