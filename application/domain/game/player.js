(class Player extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'player', parent });
    Object.assign(this, {
      ...domain.game['@hasDeck'].decorate(),
      ...domain.game['@hasPlane'].decorate(),
    });
    this.broadcastableFields([
      '_id',
      'code',
      'active',
      'ready',
      'timerEndTime',
      'timerUpdateTime',
      'eventData',
      'activeEvent',
      'availableZones',
      'planeMap',
      'deckMap',
      'userId',
      'avatarCode',
    ]);

    this.set({
      userId: data.userId,
      avatarCode: data.avatarCode,
      active: data.active,
      ready: data.ready,
      timerEndTime: data.timerEndTime,
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
