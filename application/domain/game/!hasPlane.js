(Base) =>
  class extends Base {
    planeMap = {};

    addPlane(data) {
      const plane = new domain.game.Plane(data, { parent: this });
      this.assign('planeMap', { [plane._id]: {} });
      return plane;
    }
    removePlane(plane){
      // !!! проверить, что не нужно удалять детей (zone и port)
      this.delete('planeMap', plane._id);
      plane.deleteFromParentsObjectStorage();
    }
  };
