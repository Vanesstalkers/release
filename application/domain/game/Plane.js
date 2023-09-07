(class Plane extends lib.game.gameObject {
  zoneMap = {};
  portMap = {};
  width = 500;
  height = 250;

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
      width: data.width || this.width,
      height: data.height || this.height,
      release: data.release || false,
      left: data.left || 0,
      top: data.top || 0,
      rotation: data.rotation || 0,
      customClass: data.customClass || [],
    });
    if (this.isCardPlane()) this.set({ width: 120, height: 180 });

    if (data.zoneMap) {
      data.zoneList = [];
      for (const _id of Object.keys(data.zoneMap)) data.zoneList.push(this.getStore().zone[_id]);
    }
    for (const item of data.zoneList || []) {
      const zone = new domain.game.Zone(item, { parent: this });
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
    return this.customClass.includes('card-plane');
  }

  getCodePrefix() {
    return '';
  }

  addPort(data) {
    const port = new domain.game.Port(data, { parent: this });
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
