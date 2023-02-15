(class Dice extends domain.game['!GameObject'] {
  constructor(data, { parent }) {
    super(data, { col: 'dice', parent });

    this.deleted = data.deleted;

    if (data.sideList) {
      const store = this.getGame().getStore();
      this.sideList = [
        new domain.game.DiceSide(store.diceside[data.sideList[0]._id], { parent: this }),
        new domain.game.DiceSide(store.diceside[data.sideList[1]._id], { parent: this }),
      ];
    } else {
      this.sideList = [
        new domain.game.DiceSide({ _code: 1, value: data[0] }, { parent: this }),
        new domain.game.DiceSide({ _code: 2, value: data[1] }, { parent: this }),
      ];
      if (Math.random() > 0.5) this.sideList.reverse(); // code останется в первичном виде
    }
  }
  customObjectCode({ codeTemplate, replacementFragment }, data) {
    return codeTemplate.replace(replacementFragment, '' + data[0] + data[1]);
  }

  moveToTarget(target) {
    const currentParent = this.getParent();
    currentParent.removeItem(this); // сначала удаляем, чтобы не помешать размещению на соседней зоне
    const moveResult = target.addItem(this);
    if (moveResult) {
      this.updateParent(target);
    } else {
      currentParent.addItem(this);
    }
    return moveResult;
  }
});
