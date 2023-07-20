<template>
  <div :class="['bridge', ...Object.values(customClass)]" :id="bridge._id" :style="customStyle">
    <div class="zone-wraper">
      <plane-zone v-for="id in zoneIds" :key="id" v-bind:zoneId="id" />
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';
import planeZone from './planeZone.vue';

export default {
  name: 'bridge',
  components: {
    planeZone,
  },
  props: {
    bridgeId: String,
  },
  data() {
    return { customClass: {} };
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
    bridge() {
      return this.store.bridge?.[this.bridgeId] || {};
    },
    customStyle() {
      const style = { ...this.bridge } || {};
      if (style.left) style.left += 'px';
      if (style.top) style.top += 'px';
      if (style.width) style.width += 'px';
      if (style.height) style.height += 'px';
      if (style.rotation) {
        const rotateDegree = 90 * (style.rotation || 0);
        style.transform = `rotate(${rotateDegree}deg)`;
        this.customClass = { rotate: `rotate${rotateDegree}` };
      }
      return style;
    },
    zoneIds() {
      return Object.keys(this.bridge.zoneMap || {});
    },
  },
  methods: {},
  mounted() {
    // console.log('bridge mounted', this.bridge);
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.bridge {
  position: absolute;
  z-index: 1;
}
.bridge .zone {
  margin-left: -73px;
  margin-top: -36.5px;
}
.bridge .zone.vertical {
  margin-left: -36.5px;
  margin-top: -73px;
}
</style>
