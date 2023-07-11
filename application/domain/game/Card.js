(class Card extends lib.game.gameObject {
  #events;

  constructor(data, { parent }) {
    super(data, { col: 'card', parent });

    this.title = data.title;
    this.name = data.name;
    this.played = data.played;
    this.#events = domain.cardEvent[this.name];
  }
  moveToTarget(target) {
    const currentParent = this.getParent();
    currentParent.removeItem(this); // сначала удаляем
    const moveResult = target.addItem(this);
    if (moveResult) {
      this.updateParent(target);
    } else {
      currentParent.addItem(this);
    }
    return moveResult;
  }
  getSelfConfig() {
    return { handlers: Object.keys(this.#events.handlers || {}) };
  }
  isPlayOneTime() {
    return this.#events?.config?.playOneTime;
  }
  restoreAvailable() {
    if (this.isPlayOneTime()) {
      return this.played ? false : true;
    } else {
      return true;
    }
  }
  play() {
    const game = this.game();
    const player = game.getActivePlayer();
    const config = this.getSelfConfig();
    for (const handler of config.handlers) game.addEventHandler({ handler, source: this });
    if (this.#events.init) {
      const { removeHandlers } = this.#events.init.call(this, { game, player }) || {};
      if (removeHandlers) {
        for (const handler of config.handlers) game.deleteEventHandler({ handler, source: this });
      }
    }
    this.set({ played: Date.now() });
  }
  callHandler({ handler, data = {} }) {
    if (!this.#events.handlers[handler]) throw new Error('eventHandler not found');
    const game = this.game();
    const player = game.getActivePlayer();
    if (data.targetId) data.target = game.getObjectById(data.targetId);
    return this.#events.handlers[handler].call(this, { game, player, ...data });
  }
});
