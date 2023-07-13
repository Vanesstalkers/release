(class Player extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'player', parent });
    Object.assign(this, {
      ...domain.game['@hasDeck'].decorate(),
      ...domain.game['@hasPlane'].decorate(),
    });

    this.userId = data.userId;
    this.active = data.active;
    this.ready = data.ready;
    this.timerEndTime = data.timerEndTime;
  }
});
