(class Dice extends lib.game.GameObject {
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
          new domain.game.objects.DiceSide(store.diceside[data.sideList[0]._id], { parent: this }),
          new domain.game.objects.DiceSide(store.diceside[data.sideList[1]._id], { parent: this }),
        ],
      });
    } else {
      this.set({
        sideList: [
          new domain.game.objects.DiceSide({ _code: 1, value: data[0] }, { parent: this }),
          new domain.game.objects.DiceSide({ _code: 2, value: data[1] }, { parent: this }),
        ],
      });
      if (Math.random() > 0.5) this.sideList.reverse(); // code останется в первичном виде
    }
  }

  customObjectCode({ codeTemplate, replacementFragment }, data) {
    return codeTemplate.replace(replacementFragment, '' + data[0] + data[1]);
  }
  markNew(config) {
    super.markNew(config);
    if (!this.sideList) return; // при создании объекта markNew из GameObject отрабатывает раньше добавления sideList
    this.sideList[0].markNew(config);
    this.sideList[1].markNew(config);
  }
  markDelete(config) {
    super.markDelete(config);
    this.sideList[0].markDelete(config);
    this.sideList[1].markDelete(config);
  }
  updateFakeId(config) {
    super.updateFakeId(config);
    this.sideList[0].updateFakeId(config);
    this.sideList[1].updateFakeId(config);
  }
  prepareBroadcastData({ data, player, viewerMode }) {
    let visibleId = this._id;
    let preparedData = {};
    const bFields = this.broadcastableFields();
    let fake = false;
    const parent = this.getParent();
    if (parent.matches({ className: 'Deck' })) {
      if (!parent.access[player?._id] && !this.visible && !viewerMode) {
        fake = true;
        visibleId = this.fakeId[parent.id()];
        preparedData = {};
        if (data.activeEvent !== undefined) preparedData.activeEvent = data.activeEvent;
      }
    }
    if (!fake) {
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) {
          if (key === 'sideList') preparedData[key] = value.map(({ _id }) => ({ _id }));
          else preparedData[key] = value;
        }
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
      if (target.getParent() === this.game()) {
        this.markDelete(); // удаляем локальную информацию о dice (с реальным _id)
      }
    } else {
      currentParent.addItem(this);
    }
    if (currentParent.matches({ className: 'Zone' })) currentParent.updateValues();

    return moveResult;
  }
  findAvailableZones() {
    const game = this.game();
    const result = [];

    game.disableChanges();
    {
      // чтобы не мешать расчету для соседних зон при перемещении из одной зоны в другую (ниже вернем состояние)
      this.getParent().removeItem(this);

      const zoneList = [];
      zoneList.push(
        ...game.getObjects({ className: 'Plane', directParent: game }).reduce((arr, plane) => {
          return arr.concat(plane.getObjects({ className: 'Zone' }));
        }, [])
      );
      zoneList.push(
        ...game.getObjects({ className: 'Bridge', directParent: game }).reduce((arr, bridge) => {
          return arr.concat(bridge.getObjects({ className: 'Zone' }));
        }, [])
      );

      for (const zone of zoneList) {
        const status = zone.checkIsAvailable(this);
        result.push({ zone, status });
      }

      // восстанавливаем состояние для ранее удаленного dice
      this.getParent().addItem(this);
    }
    game.enableChanges();
    return result;
  }
});
