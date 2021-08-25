<template>
  <Dialog :visible="visible" modal="true" close-on-escape="true" show-header="false">
    <div class="p-grid p-pb-2 p-mt-4 p-pl-3 p-pr-3">
      <div class="p-col-12" style="text-align: left; ">
        <h4 class="p-mt-2">Kanal İşlemleri</h4>
      </div>
      <div class="p-col-6">
        <h6 class="p-text-left">Düğümler</h6>
        <div class="p-inputgroup padding-left-zero">
          <Dropdown v-model="selectedPeer" :options="peers" optionLabel="label" placeholder="Düğüm Seçin"
                    :disabled="peerDisabled"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Kanallar</h6>
        <div class="p-inputgroup padding-left-zero">
          <Dropdown v-model="selectedChannel" :options="channels" optionLabel="label" placeholder="Kanal Seçin"
                    :disabled="channelDisabled"/>
        </div>
      </div>

      <div class="p-col-6" v-if="showJoinChannelInput">
        <h6 class="p-text-left">Yeni Kanal Adı</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText v-model="newChannelName" placeholder="Yeni Kanal Adı"/>
        </div>
      </div>

      <div class="p-col-6" v-if="showJoinChannelInput">
        <h6 class="p-text-left">Orderer Bilgleri</h6>
        <div class="p-col padding-zero p-inputgroup">
          <div class="p-col padding-left-zero p-inputgroup">
            <InputText v-model="ordererAddress" placeholder="Orderer Adresi"/>
          </div>
          <div class="p-col padding-left-zero p-inputgroup">
            <InputText v-model="ordererOrgName" placeholder="Orderder Org Adı"/>
          </div>
        </div>
      </div>
      <div class="p-col-9">
      </div>

      <div class="p-col-3 p-align-end">
        <Button :label="btnMsg" class="p-col-12" :disabled="btnDisabled" @click="onBackBtnClick"></Button>
      </div>

    </div>
  </Dialog>
</template>

<script>
export default {
  name: "ChaincodeConfigDialog",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onBackBtnClick() {

    }
  }
}
</script>

<style scoped>

</style>