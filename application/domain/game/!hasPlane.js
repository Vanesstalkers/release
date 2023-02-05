(Base) =>
  class extends Base {
    planeList = [];

    addPlane(data) {
      const plane = new domain.game.Plane(data, { parent: this });
      this.planeList.push(plane);

      return plane;
    }
  };
