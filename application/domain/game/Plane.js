(class Plane extends domain.game['!GameObject'] {
  zoneMap = {};
  portMap = {};
  width = 500;
  height = 250;

  constructor(data, { parent }) {
    super(data, { col: 'plane', parent });

    this.release = data.release || false;
    this.left = data.left || 0;
    this.top = data.top || 0;
    this.rotation = data.rotation || 0;
    if (data.width) this.width = data.width;
    if (data.height) this.height = data.height;

    if (data.zoneMap) {
      data.zoneList = [];
      for (const _id of Object.keys(data.zoneMap)) {
        data.zoneList.push(this.getStore().zone[_id]);
      }
    }
    if (data.zoneList?.length) {
      data.zoneList.forEach((item) => {
        const zone = new domain.game.Zone(item, { parent: this });
        this.set('zoneMap', { ...this.zoneMap, [zone._id]: {} });
      });
    }
    if (data.zoneLinks) {
      Object.entries(data.zoneLinks).forEach(([zoneCode, sideList]) => {
        Object.entries(sideList).forEach(([sideCode, links]) => {
          links.forEach((link) => {
            const [linkZoneCode, linkSideCode] = link.split('.');
            const zone = this.getObjectByCode(zoneCode);
            const side = zone.getObjectByCode(sideCode);
            const linkZone = this.getObjectByCode(linkZoneCode);
            const linkSide = linkZone.getObjectByCode(linkSideCode);
            side.addLink(linkSide);
            linkSide.addLink(side);
          });
        });
      });
    }

    if (data.portMap) {
      data.portList = [];
      for (const _id of Object.keys(data.portMap)) {
        data.portList.push(this.getStore().port[_id]);
      }
    }    
    if (data.portList?.length) {
      for (const port of data.portList) {
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
  }

  getCodePrefix() {
    return '';
  }

  addPort(data) {
    const port = new domain.game.Port(data, { parent: this });
    this.set('portMap', {...this.portMap, [port._id]: {}});
  }
  getZone() {
    return Object.keys(this.zoneMap).map((_id) => this.getStore().zone[_id]).find((zone) => zone.code === code);
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
});
