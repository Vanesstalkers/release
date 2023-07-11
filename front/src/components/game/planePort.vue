<template>
  <div
    v-if="port._id"
    class="port"
    :id="port.code"
    :style="{ left: port.left + 'px', top: port.top + 'px', opacity: port.linkedBridge ? 0 : 1 }"
    :x="port.left + 37.5"
    :y="port.top + 37.5"
  />
</template>

<script>
export default {
  props: {
    portId: String,
    linkLines: Object,
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    port() {
      return this.store.port?.[this.portId];
    },
  },
  methods: {},
  mounted() {
    this.$nextTick(() => {
      const portEl = document.getElementById(this.port.code);
      for (const link of Object.keys(this.port.links)) {
        const linkEl = document.getElementById(link);
        if (portEl.closest('.plane') && linkEl.closest('.plane')) {
          const x1 = portEl.getAttribute('x');
          const y1 = portEl.getAttribute('y');
          const x2 = linkEl.getAttribute('x');
          const y2 = linkEl.getAttribute('y');
          const key = [[x1, y1].join('.'), [x2, y2].join('.')].sort().join('.');
          this.$set(this.linkLines, key, { x1, y1, x2, y2 });
        }
      }
    });
  },
};
</script>

<style scoped>
.port {
  position: absolute;
  height: 75px;
  width: 75px;
  --border: 1px solid yellow;
  background-image: url(../../assets/clear-black-back.png);
  background-size: 75px;
  background-position: center;
  background-repeat: no-repeat;
  background: black;
  opacity: 1;
}
.port::after {
  content: '';
  background-image: url(../../assets/portIcon.png);
  width: 100%;
  height: 100%;
  background-size: 30px;
  background-position: center;
  background-repeat: no-repeat;
  display: block;
  opacity: 0.5;
}
</style>
