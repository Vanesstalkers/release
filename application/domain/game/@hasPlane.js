({
  decorate: () => ({
    planeMap: {},
    addPlane(data, { preventEmitClassEvent = false } = {}) {
      const plane = new domain.game.Plane(data, { parent: this });
      this.set({ planeMap: { [plane._id]: {} } });
      if (!preventEmitClassEvent) this.emit('addPlane', {}, { softCall: true });
      return plane;
    },
    removePlane(plane) {
      // !!! проверить, что не нужно удалять детей (zone и port)
      this.set({ planeMap: { [plane._id]: null } });
      plane.deleteFromParentsObjectStorage();
    },
  }),
});
