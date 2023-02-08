(class ZoneSide extends domain.game['!GameObject'] {
  constructor(data, { parent }) {
    super(data, { col: 'zoneside', parent });

    this.value = data.value || undefined;
    this.links = data.links || {};
    this.expectedValues = data.expectedValues || {};
  }

  addLink(link) {
    this.links[link._id] = link.code;
  }
  updateExpectedValues() {
    this.expectedValues = {};
    for (const linkCode of Object.values(this.links)) {
      const link = this.getGame().getObjectByCode(linkCode);
      if (link.value !== undefined) this.expectedValues[link.value] = true;
    }
  }
});
