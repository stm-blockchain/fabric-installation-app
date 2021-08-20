<template>
  <div class="layout-topbar">
<!--    <button class="p-link layout-menu-button" @click="onMenuToggle">-->
<!--      <span class="pi pi-bars"></span>-->
<!--    </button>-->
    <div class="layout-topbar-icons p-mr-6">
<!--			<span class="layout-topbar-search">-->
<!--				<InputText type="text" placeholder="Search"/>-->
<!--				<span class="layout-topbar-search-icon pi pi-search"></span>-->
<!--			</span>-->
      <button class="p-link" @click="onEventClick">
        <span class="layout-topbar-item-text">CA</span>
<!--        <span class="layout-topbar-icon pi pi-calendar"></span>-->
<!--        <span class="layout-topbar-badge">5</span>-->
      </button>
      <button class="p-link">
        <span class="layout-topbar-item-text">Peer</span>
<!--        <span class="layout-topbar-icon pi pi-cog"></span>-->
      </button>
      <button class="p-link">
        <span class="layout-topbar-item-text">Orderer</span>
<!--        <span class="layout-topbar-icon pi pi-user"></span>-->
      </button>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    onMenuToggle(event) {
      this.$emit('menu-toggle', event);
    },
    onEventClick() {
      console.log("hello");
    }
  }
}
</script>