<template>
  <div class="sideList">
    <div
      v-for="(side, index) in filledSideList"
      :key="side._id"
      :index="index"
      :id="side._id"
      :code="side.code"
      :class="['side' + index]"
      :x="position.left + (position.vertical ? 36 : index === 0 ? 36 : 108)"
      :y="position.top + (position.vertical ? (index === 0 ? 36 : 108) : 36)"
    />
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  props: {
    sideList: Array,
    position: {
      left: Number,
      top: Number,
    },
    linkLines: Object,
  },
  setup() {
    return inject('gameGlobals');
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore();
    },
    filledSideList() {
      return this.sideList.map(({ _id }) => this.store.zoneside?.[_id] || {});
    },
  },
  methods: {
    paintLinks() {
      for (const side of this.filledSideList) {
        const sideEl = document.getElementById(side._id);
        for (const link of Object.keys(side.links)) {
          const linkEl = document.getElementById(link);
          if (sideEl.closest('.plane') && linkEl.closest('.plane')) {
            const x1 = sideEl.getAttribute('x');
            const y1 = sideEl.getAttribute('y');
            const x2 = linkEl.getAttribute('x');
            const y2 = linkEl.getAttribute('y');
            const key = [[x1, y1].join('.'), [x2, y2].join('.')].sort().join('.');
            this.$set(this.linkLines, key, { x1, y1, x2, y2 });
          }
        }
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.paintLinks();
    });
  },
};
</script>

<style scoped>
.sideList {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}
.sideList > * {
  position: absolute;
}
.sideList > .side0 {
  top: 50%;
  left: 25%;
}
.sideList > .side1 {
  top: 50%;
  left: 75%;
}
.vertical .sideList > .side0 {
  top: 25%;
  left: 50%;
}
.vertical .sideList > .side1 {
  top: 75%;
  left: 50%;
}
</style>
