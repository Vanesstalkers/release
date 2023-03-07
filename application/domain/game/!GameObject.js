(class {
  _id;
  col;
  #game;
  #parent;
  #parentList;
  #_objects = {};
  #fakeParent = null;

  constructor(data, { col, parent } = {}) {
    if (!this._id) this._id = data._id || db.mongo.ObjectID();
    if (col) this.col = col;
    this.fakeId = data.fakeId;
    this.activeEvent = data.activeEvent;
    this.eventData = data.eventData || {};

    this.setParent(parent);
    this.addToParentsObjectStorage();
    if (parent) {
      const game = parent.getGame();
      this.setGame(game);
      if (!game.store[this.col]) game.store[this.col] = {};
      game.store[this.col][this._id] = this;
    }

    const customObjectCode = Object.getPrototypeOf(this).customObjectCode;
    if (data.code) {
      this.code = data.code;
    } else if (typeof customObjectCode === 'function') {
      const replacementFragment = '$$_code_$$';
      const codeTemplate = this.getCodeTemplate(this.constructor.name + '[' + replacementFragment + ']');
      this.code = customObjectCode.call(this, { codeTemplate, replacementFragment }, data);
    } else {
      this.code = this.getCodeTemplate(this.constructor.name + '[' + (data._code || '') + ']');
    }
  }
  updateFakeId() {
    this.fakeId = (Date.now() + Math.random()).toString();
  }
  set(key, value) {
    if (!this.col) {
      throw new Error(`${key}=${value} not saved to changes ('col' is no defined)`);
    } else {
      this.#game.change({ col: this.col, _id: this._id, key, value });
    }
    this[key] = value;
  }
  assign(objKey, value) {
    this.set(objKey, { ...(this[objKey] || {}), ...value });
  }
  delete(objKey, key) {
    delete this[objKey][key];
    this.set(objKey, { ...this[objKey] });
  }
  default_customObjectCode({ codeTemplate, replacementFragment }, data) {
    return codeTemplate.replace(replacementFragment, data._code);
  }
  addToParentsObjectStorage() {
    let parent = this.getParent();
    if (parent) {
      do {
        parent.addToObjectStorage(this);
      } while ((parent = parent.getParent()));
    }
  }
  addToObjectStorage(obj) {
    this.#_objects[obj._id] = obj;
  }
  deleteFromParentsObjectStorage() {
    let parent = this.getParent();
    do {
      parent.deleteFromObjectStorage(this);
    } while ((parent = parent.getParent()));
  }
  deleteFromObjectStorage(obj) {
    if (this.#_objects[obj._id]) delete this.#_objects[obj._id];
  }
  getObjectById(_id) {
    // _id всегда уникален
    return this.#_objects[_id];
  }
  getObjectByCode(code) {
    // внутри одного родителя code может быть не уникален
    return Object.values(this.#_objects).find((obj) => {
      obj.setFakeParent(this);
      const result = obj.code === obj.getCodeTemplate(code);
      obj.setFakeParent(null);
      return result;
    });
  }
  getCodePrefix() {
    return this.getParent()?.code || '';
  }
  getCodeSuffix() {
    return '';
  }
  getCodeTemplate(_code) {
    return '' + this.getCodePrefix() + _code + this.getCodeSuffix();
  }
  getObjects({ className, directParent } = {}) {
    let result = Object.values(this.#_objects);
    if (className) result = result.filter((obj) => obj.constructor.name === className);
    if (directParent) result = result.filter((obj) => obj.getParent() === directParent);
    return result;
  }
  setParent(parent) {
    if (parent) {
      this.#parent = parent;
      this.#parentList = [parent].concat(parent.getParentList() || []); // самый дальний родитель в конце массива
    }
  }
  setFakeParent(parent) {
    this.#fakeParent = parent;
  }
  updateParent(newParent) {
    this.updateFakeId();
    this.getParent().deleteFromObjectStorage(this);
    this.setParent(newParent);
    newParent.addToObjectStorage(this);
  }
  getParent() {
    return this.#fakeParent || this.#parent;
  }
  getParentList() {
    return this.#parentList;
  }
  findParent({ className } = {}) {
    return this.#parentList.find((parent) => {
      if (className && parent.constructor.name !== className) return false;
      return true;
    });
  }
  matches({ className } = {}) {
    if (className && this.constructor.name === className) return true;
    return false;
  }
  getAllLinks() {
    return {
      parent: this.getParent(),
      parentList: this.getParentList(),
      objects: this.getObjects(),
    };
  }
  getGame() {
    return this.#game;
  }
  setGame(game) {
    this.#game = game;
  }
  getStore() {
    return this.getGame().store;
  }
  getFlattenStore() {
    return Object.values(this.getStore()).reduce((obj, item) => ({ ...obj, ...item }), {});
  }
});
