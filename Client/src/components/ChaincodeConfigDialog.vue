<template>
  <Dialog v-model:visible="display">
    <div class="p-grid p-pb-2 p-mt-4 p-pl-3 p-pr-3">
      <div class="p-col-12" style="text-align: left; ">
        <h4 class="p-mt-2">Kanal İşlemleri</h4>
      </div>
      <div class="p-col-6">
        <h6 class="p-text-left">Düğümler</h6>
        <div class="p-inputgroup padding-left-zero">
          <Dropdown placeholder="Düğüm Seçin"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Kanallar</h6>
        <div class="p-inputgroup padding-left-zero">
          <Dropdown placeholder="Kanal Seçin"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Yeni Kanal Adı</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText placeholder="Yeni Kanal Adı"/>
        </div>
      </div>

      <div class="p-col-6" >
        <h6 class="p-text-left">Orderer Bilgleri</h6>
        <div class="p-col padding-zero p-inputgroup">
          <div class="p-col padding-left-zero p-inputgroup">
            <InputText placeholder="Orderer Adresi"/>
          </div>
          <div class="p-col padding-left-zero p-inputgroup">
            <InputText placeholder="Orderder Org Adı"/>
          </div>
        </div>
      </div>


      <div class="p-col-9">
      </div>

      <div class="p-col-3 p-align-end">
        <Button class="p-col-12" @click="onBackBtnClick"></Button>
      </div>

    </div>
  </Dialog>
</template>

<script>
export default {
  name: "ChaincodeConfigDialog",
  props: ['visible'],
  methods: {
    onBackBtnClick() {
      this.$emit('close-dialog')
    }
  },
  data() {
    return {
      display: false
    }
  },
  watch: {
    visible: function (newValue) {
      this.display = newValue;
    }
  }
}
</script>

<style scoped>

</style>