(class Player extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'player', parent });
    Object.assign(this, {
      ...domain.game['@hasDeck'].decorators,
      ...domain.game['@hasPlane'].decorators,
    });

    this.userId = data.userId;
    this.active = data.active;
    this.ready = data.ready;
    this.timerEndTime = data.timerEndTime;
  }
});
