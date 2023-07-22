(class Dice extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'dice', parent });
    this.broadcastableFields([
      '_id',
      'code',
      'sideList',
      'deleted',
      'visible',
      'locked',
      'placedAtRound',
      'activeEvent',
    ]);

    this.set({
      deleted: data.deleted,
      visible: data.visible,
      locked: data.locked,
      placedAtRound: data.placedAtRound,
    });

    if (data.sideList) {
      const store = this.game().getStore();
      this.set({
        sideList: [
          new domain.game.DiceSide(store.diceside[data.sideList[0]._id], { parent: this }),
          new domain.game.DiceSide(store.diceside[data.sideList[1]._id], { parent: this }),
        ],
      });
    } else {
      this.set({
        sideList: [
          new domain.game.DiceSide({ _code: 1, value: data[0] }, { parent: this }),
          new domain.game.DiceSide({ _code: 2, value: data[1] }, { parent: this }),
        ],
      });
      if (Math.random() > 0.5) this.sideList.reverse(); // code останется в первичном виде
    }
  }
  customObjectCode({ codeTemplate, replacementFragment }, data) {
    return codeTemplate.replace(replacementFragment, '' + data[0] + data[1]);
  }
  prepareBroadcastData({ data, player }) {
    let visibleId = this._id;
    let preparedData = {};
    const bFields = this.broadcastableFields();
    let fake = false;
    const parent = this.getParent();
    if (parent.matches({ className: 'Deck' })) {
      if (!parent.access[player?._id] && !this.visible) {
        fake = true;
        visibleId = this.fakeId[parent.id()];
        preparedData = {};
        if (data.activeEvent !== undefined) preparedData.activeEvent = data.activeEvent;
      }
    }
    if (!fake) {
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) preparedData[key] = value;
      }
    }
    return { visibleId, preparedData };
  }

  getTitle() {
    return this.sideList.map((side) => side.value).join('-');
  }
  moveToTarget(target) {
    const currentParent = this.getParent();
    currentParent.removeItem(this); // сначала удаляем, чтобы не помешать размещению на соседней зоне
    const moveResult = target.addItem(this);

    if (moveResult) {
      this.set({ visible: null });
      this.updateParent(target);
    } else {
      currentParent.addItem(this);
    }
    if (currentParent.matches({ className: 'Zone' })) currentParent.updateValues();

    return moveResult;
  }
});
