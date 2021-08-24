<template>
  <div class="layout-topbar">
    <div class="layout-topbar-icons p-mr-6" v-show="showItems">
      <button class="p-link p-pl-4 p-pr-4 p-pt-1 p-pb-1" :style=[caBackground] @click="onEventClick('ca')">
        <span class="layout-topbar-item-text">CA</span>
      </button>
      <button class="p-link p-pl-4 p-pr-4 p-pt-1 p-pb-1" :style=[peerBackground] @click="onEventClick('peer')">
        <span class="layout-topbar-item-text">Peer</span>
      </button>
      <button class="p-link p-pl-4 p-pr-4 p-pt-1 p-pb-1" :style=[ordererBackground] @click="onEventClick('orderer')">
        <span class="layout-topbar-item-text">Orderer</span>
      </button>
    </div>
  </div>
</template>

<script>
import { MENU_TYPES } from "@/utilities/Utils";

const BACKGROUND_WHITE = 'background-color: white'

export default {
  data() {
    return {
      caBackground: '',
      peerBackground: '',
      ordererBackground: ''
    }
  },
  props: {
    showItems: Boolean,
    currentTab: {
      type: String,
      default: ''
    }
  },
  watch: {
    currentTab: function(newTab) { // watch it
      // console.log('Prop changed: ', newVal, ' | was: ', oldVal)
      this.setTopBarSelected(newTab);
    }
  },
  methods: {
    onMenuToggle(event) {
      this.$emit('menu-toggle', event);
    },
    onEventClick(menuType) {
      console.log(menuType);
      this.setTopBarSelected(menuType);
    },
    setTopBarSelected(type) {
      switch (type) {
        case MENU_TYPES.CA:
          this.caBackground = BACKGROUND_WHITE;
          this.$router.push({name: 'caInput'})
          this.peerBackground = '';
          this.ordererBackground = '';
          break;
        case MENU_TYPES.PEER:
          this.$router.push({name: 'newPeer'})
          this.peerBackground = BACKGROUND_WHITE;
          this.ordererBackground = '';
          this.caBackground = '';
          break;
        case MENU_TYPES.ORDERER:
          this.ordererBackground = BACKGROUND_WHITE;
          this.peerBackground = '';
          this.caBackground = '';
          break;
      }
    }
  }
}
</script>