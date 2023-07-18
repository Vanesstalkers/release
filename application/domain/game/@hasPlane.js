({
  decorate: () => ({
    planeMap: {},
    addPlane(data) {
      const plane = new domain.game.Plane(data, { parent: this });
      this.set({ planeMap: { [plane._id]: {} } });
      return plane;
    },
    removePlane(plane) {
      // !!! проверить, что не нужно удалять детей (zone и port)
      this.set({ planeMap: { [plane._id]: null } });
      plane.deleteFromParentsObjectStorage();
    },
  }),
});
