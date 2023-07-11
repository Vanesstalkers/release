<template>
  <div
    v-if="plane._id"
    :id="plane._id"
    :class="['plane', activeEvent ? 'active-event' : '', ...plane.customClass, ...Object.values(customClass)]"
    :style="customStyle"
    v-on:click.stop="e => (activeEvent ? choosePlane() : selectPlane(e))"
  >
    <div class="zone-wraper">
      <plane-zone v-for="id in zoneIds" :key="id" v-bind:zoneId="id" :linkLines="linkLines" />
    </div>
    <div class="port-wraper">
      <plane-port v-for="id in portIds" :key="id" v-bind:portId="id" :linkLines="linkLines" />
    </div>
    <div v-if="!cardPlane" div class="custom-bg">
      <span
        v-for="item in customBG(plane._id)"
        :key="item.code"
        :style="`background-position-x: ${item.x}; background-position-y: ${item.y}`"
      />
    </div>
    <svg>
      <line
        v-for="[key, line] in Object.entries(linkLines)"
        :key="key"
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        fill="none"
        stroke="yellow"
        stroke-width="10"
      />
    </svg>
  </div>
</template>

<script>
import planeZone from './planeZone.vue';
import planePort from './planePort.vue';

export default {
  name: 'plane',
  components: {
    planePort,
    planeZone,
  },
  data() {
    return { linkLines: {}, customClass: {}, inHandStyle: {} };
  },
  props: {
    planeId: String,
    inHand: Boolean,
    gamePlaneScale: Number,
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    plane() {
      return this.store.plane?.[this.planeId] || {};
    },
    customStyle() {
      const style = { ...this.plane, ...(this.inHand ? this.inHandStyle : {}) } || {};
      if (style.left) style.left += 'px';
      if (style.top) style.top += 'px';
      if (style.width) style.width += 'px';
      if (style.height) style.height += 'px';
      if (style.rotation) {
        const rotateDegree = 90 * (style.rotation || 0);
        style.transform = `rotate(${rotateDegree}deg)`;
        this.customClass = { ...this.customClass, rotate: `rotate${rotateDegree}` };
      }
      return style;
    },
    cardPlane() {
      return this.plane.customClass.includes('card-plane');
    },
    zoneIds() {
      return Object.keys(this.plane.zoneMap || {});
    },
    portIds() {
      return Object.keys(this.plane.portMap || {});
    },
    activeEvent() {
      return this.$root.sessionPlayerIsActive && this.plane.activeEvent;
    },
  },
  methods: {
    async selectPlane(event) {
      const $plane = event.target.closest('.plane');
      if ($plane.closest('.player.iam')) {
        // this.$store.commit('setAvailablePorts', []);
        await api.game.action({ name: 'getPlanePortsAvailability', data: { joinPlaneId: this.planeId } }).catch(err => {
          prettyAlert(err.message);
        });
      }
    },
    async choosePlane() {
      await api.game.action({ name: 'eventTrigger', data: { eventData: { targetId: this.planeId } } }).catch(err => {
        prettyAlert(err.message);
      });
    },
    customBG(pid) {
      let storageFillData = localStorage.getItem('gamePlaneBackgroundData');
      if (storageFillData)
        try {
          storageFillData = JSON.parse(storageFillData);
        } catch (e) {}
      if (!storageFillData) storageFillData = {};
      let fillData = storageFillData[pid];

      if (fillData) return fillData;

      fillData = [];

      for (let i = 0; i < 18; i++) {
        fillData[i] = {
          x: -80 * Math.floor(14 * Math.random()) + 'px',
          y: -80 * Math.floor(6 * Math.random()) + 'px',
        };
      }
      storageFillData[pid] = fillData;
      localStorage.setItem('gamePlaneBackgroundData', JSON.stringify(storageFillData));

      return fillData;
    },
  },
  mounted() {
    // $nextTick не всегда помогает при запуске новой игры
    setTimeout(() => {
      if (this.inHand) {
        this.customClass = { ...this.customClass, inHand: `in-hand` };
      } else this.inHandStyle = {};
      if (this.$parent.updatePlaneScale) this.$parent.updatePlaneScale();
    }, 100);
  },
};
</script>

<style scoped>
.plane {
  position: relative;
  position: absolute;
  width: 500px;
  height: 250px;
  margin-bottom: 10px;
  transform-origin: 0 0;
}
.plane.active-event {
  box-shadow: 0 0 20px 8px yellow !important;
}
.plane:not(.card-plane):after {
  content: '';
  z-index: -1;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: url(../../assets/plane.png);
}
.plane > .zone-wraper,
.plane > .port-wraper {
  z-index: 1;
  position: relative;
}

.plane .custom-bg {
  display: flex;
  flex-wrap: wrap;
  border-radius: 20px;
  overflow: hidden;
  position: absolute;
  left: 10px;
  top: 5px;
  width: 480px;
  height: 240px;
  z-index: 0;
  filter: blur(2px);
  --filter: grayscale(75%);
  --filter: grayscale(100%) brightness(200%) blur(2px);
}
.plane .custom-bg > span {
  width: 80px;
  height: 80px;
  background-image: url(../../assets/tiles.png);
  background-size: 1120px;
  background-repeat: no-repeat;
}

.plane > svg {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.plane.rotate90 {
  transform: rotate(90deg);
}
.plane.rotate180 {
  transform: rotate(180deg);
}
.plane.rotate270 {
  transform: rotate(270deg);
}

.plane.in-hand:not(.card-plane) {
  transform: scale(0.5);
  transform-origin: center left;
  margin: 125px -250px 0px 0px;
}
#game.mobile-view.portrait-view .plane.in-hand:not(.card-plane) {
  transform: scale(0.7);
  transform-origin: top right;
  margin: 25px 0px -75px 0px;
}

.plane.card-plane {
}
</style>
