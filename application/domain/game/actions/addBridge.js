(function (data) {
  const store = this.getStore();
  const bridge = new domain.game.objects.Bridge(data, { parent: this });
  this.set({ bridgeMap: { [bridge._id]: {} } });

  if (data.zoneMap) {
    data.zoneList = [];
    for (const _id of Object.keys(data.zoneMap)) data.zoneList.push(store.zone[_id]);
  }
  for (const item of data.zoneList || []) {
    const zone = new domain.game.objects.Zone(item, { parent: bridge });
    bridge.set({ zoneMap: { [zone._id]: {} } });
  }

  if (data.zoneLinks) {
    for (const [zoneCode, sideList] of Object.entries(data.zoneLinks)) {
      for (const [sideCode, links] of Object.entries(sideList)) {
        for (const link of links) {
          const [linkZoneCode, linkSideCode] = link.split('.');
          const zone = bridge.getObjectByCode(zoneCode);
          const side = zone.getObjectByCode(sideCode);
          const linkZone = bridge.game().getObjectByCode(linkZoneCode);
          const linkSide = linkZone.getObjectByCode(linkSideCode);
          side.addLink(linkSide);
          linkSide.addLink(side);
          linkZone.updateValues();
        }
      }
    }
  }

  return bridge.code;
});
