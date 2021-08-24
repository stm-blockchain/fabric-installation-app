<template>
  <div class="layout-topbar">
    <div class="layout-topbar-icons p-mr-6" v-show="showItems">
      <button class="p-link" @click="onEventClick('ca')">
        <span class="layout-topbar-item-text">CA</span>
      </button>
      <button class="p-link" @click="onEventClick('peer')">
        <span class="layout-topbar-item-text">Peer</span>
      </button>
      <button class="p-link" @click="onEventClick('orderer')">
        <span class="layout-topbar-item-text">Orderer</span>
      </button>
    </div>
  </div>
</template>

<script>
import { MENU_TYPES } from "@/utilities/Utils";

export default {
  props: {
    showItems: Boolean,
    currentTab: {
      type: String,
      default: ''
    }
  },
  methods: {
    onMenuToggle(event) {
      this.$emit('menu-toggle', event);
    },
    onEventClick(menuType) {
      console.log(menuType);
      switch (menuType) {
        case MENU_TYPES.PEER:
        case MENU_TYPES.ORDERER:
          break;
      }
    }
  }
}
</script>