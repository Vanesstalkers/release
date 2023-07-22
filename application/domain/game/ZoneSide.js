(class ZoneSide extends lib.game.gameObject {
  constructor(data, { parent }) {
    super(data, { col: 'zoneside', parent });
    this.broadcastableFields(['_id', 'code', 'value', 'links']);

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
    const expectedValues = lib.utils.keysToNull(this.expectedValues);
    for (const linkCode of Object.values(this.links)) {
      const link = this.game().getObjectByCode(linkCode);
      if (link.value != null)
        // "!= null" === "a !== null && a !== undefined"
        expectedValues[link.value] = true;
    }
    this.set({ expectedValues });
  }
});
