(class ZoneSide extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'zoneside', parent });

    this.set({
      value: data.value,
      links: data.links || {},
      expectedValues: data.expectedValues || {},
    });
  }

  addLink(link) {
    this.set({ links: { [link._id]: link.code } });
  }
  updateExpectedValues() {
    const expectedValues = {};
    for (const linkCode of Object.values(this.links)) {
      const link = this.game().getObjectByCode(linkCode);
      if (link.value !== undefined) expectedValues[link.value] = true;
    }
    this.set({ expectedValues });
  }
});
