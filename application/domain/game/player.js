(class Player extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'player', parent });
    Object.assign(this, {
      ...domain.game['@hasDeck'].decorate(),
      ...domain.game['@hasPlane'].decorate(),
    });
    this.broadcastableFields(['_id', 'code', 'active', 'timerEndTime', 'eventData', 'activeEvent']);

    this.set({
      userId: data.userId,
      active: data.active,
      ready: data.ready,
      timerEndTime: data.timerEndTime,
    });
  }
});
