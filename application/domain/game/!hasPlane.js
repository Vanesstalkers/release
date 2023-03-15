(Base) =>
  class extends Base {
    planeMap = {};

    addPlane(data) {
      const plane = new domain.game.Plane(data, { parent: this });
      this.assign('planeMap', { [plane._id]: {} });
      return plane;
    }
    removePlane(plane){
      // не проверял работоспособность
      this.delete('planeMap', plane._id);
      plane.deleteFromParentsObjectStorage();
    }
  };
