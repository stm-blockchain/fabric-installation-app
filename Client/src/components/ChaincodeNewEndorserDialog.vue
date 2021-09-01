<template>
  <Dialog v-model:visible="display" @hide="onBackBtnClick">
    <template #header>
      Chaincode Bilgileri
    </template>
    <div class="p-grid p-pb-2 p-pl-3 p-pr-3">
      <div class="p-col-6">
        <h6 class="p-text-left">Chaincode Adı</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText placeholder="Chaincode Adı"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Chaincode Versiyonu</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText placeholder="Chaincode Versiyonu"/>
        </div>
      </div>
    </div>
    <template #footer>
      <Button class="p-col-12" @click="onBackBtnClick"></Button>
    </template>
  </Dialog>
</template>

<script>
export default {
  name: "ChaincodeNewEndorserDialog",
  data() {
    return {display: false}
  },
  props: ['visible'],
  methods: {
    onBackBtnClick() {
      this.$emit('close-dialog')
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