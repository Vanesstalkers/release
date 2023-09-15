(class Plane extends lib.game.GameObject {
  zoneMap = {};
  portMap = {};

  constructor(data, { parent }) {
    super(data, { col: 'plane', parent });
    this.broadcastableFields([
      '_id',
      'code',
      'price',
      'zoneMap',
      'portMap',
      'width',
      'height',
      'left',
      'top',
      'rotation',
      'customClass',
      'activeEvent',
    ]);

    this.set({
      price: data.price,
      width: data.width,
      height: data.height,
      left: data.left || 0,
      top: data.top || 0,
      rotation: data.rotation || 0,
      release: data.release || false,
      customClass: data.customClass || [],
      cardPlane: data.cardPlane || false,
    });

    if (data.zoneMap) {
      data.zoneList = [];
      for (const _id of Object.keys(data.zoneMap)) data.zoneList.push(this.getStore().zone[_id]);
    }
    for (const item of data.zoneList || []) {
      const zone = new domain.game.objects.Zone(item, { parent: this });
      this.set({ zoneMap: { [zone._id]: {} } });
    }
    if (data.zoneLinks) {
      for (const [zoneCode, sideList] of Object.entries(data.zoneLinks)) {
        for (const [sideCode, links] of Object.entries(sideList)) {
          for (const link of links) {
            const [linkZoneCode, linkSideCode] = link.split('.');
            const zone = this.getObjectByCode(zoneCode);
            const side = zone.getObjectByCode(sideCode);
            const linkZone = this.getObjectByCode(linkZoneCode);
            const linkSide = linkZone.getObjectByCode(linkSideCode);
            side.addLink(linkSide);
            linkSide.addLink(side);
          }
        }
      }
    }

    if (data.portMap) {
      data.portList = [];
      for (const _id of Object.keys(data.portMap)) data.portList.push(this.getStore().port[_id]);
    }
    for (const port of data.portList || []) {
      const filledLinks = {};
      for (const linkCode of Object.values(port.links)) {
        const [linkZoneCode, linkSideCode] = linkCode.split('.');
        const linkZone = this.getObjectByCode(linkZoneCode);
        const linkSide = linkZone.getObjectByCode(linkSideCode);
        filledLinks[linkSide._id] = linkCode;
      }
      this.addPort({ ...port, links: filledLinks });
    }
  }

  isCardPlane() {
    return this.cardPlane;
  }

  getCodePrefix() {
    return '';
  }

  addPort(data) {
    const port = new domain.game.objects.Port(data, { parent: this });
    this.set({ portMap: { [port._id]: {} } });
  }
  getZone() {
    return Object.keys(this.zoneMap)
      .map((_id) => this.getStore().zone[_id])
      .find((zone) => zone.code === code);
  }

  getCurrentRotation() {
    return this.rotation;
  }
  getPosition() {
    switch (this.getCurrentRotation()) {
      case 0:
        return {
          left: this.left,
          right: this.left + this.width,
          top: this.top,
          bottom: this.top + this.height,
        };
      case 1:
        return {
          left: this.left - this.height,
          right: this.left,
          top: this.top,
          bottom: this.top + this.width,
        };
      case 2:
        return {
          left: this.left - this.width,
          right: this.left,
          top: this.top - this.height,
          bottom: this.top,
        };
      case 3:
        return {
          left: this.left,
          right: this.left + this.height,
          top: this.top - this.width,
          bottom: this.top,
        };
    }
  }
  moveToTarget(target) {
    const currentParent = this.getParent();
    currentParent.removeItem(this); // сначала удаляем
    const moveResult = target.addItem(this);
    if (moveResult) {
      this.updateParent(target);
    } else {
      currentParent.addItem(this); // восстанавливаем, если не получилось переместить
    }
    return moveResult;
  }
});
