<template>
  <Dialog v-model:visible="display" @hide="onBtnClick">
    <template #header>
      Chaincode Bilgileri
    </template>
    <div class="p-grid p-pb-2 p-pl-3 p-pr-3">
      <div class="p-col-6">
        <h6 class="p-text-left">Kanallar</h6>
        <div class="p-inputgroup padding-left-zero">
          <Dropdown v-model="selectedChannel" :options="channels" optionLabel="label" placeholder="Kanal Seçin"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Paket</h6>
        <div class="p-inputgroup padding-left-zero">
          <Dropdown v-model="selectedPackage" :options="packages" optionLabel="label" placeholder="Paket Seçin"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Chaincode Adı</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText v-model="ccName" placeholder="Chaincode Adı"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Chaincode Versiyonu</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText v-model="version" placeholder="Chaincode Versiyonu"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Sekans No</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText v-model="seq" placeholder="Sekans No"/>
        </div>
      </div>

      <div class="p-col-9">
      </div>

      <div class="p-col-3 p-align-end">
        <Button class="p-col-12" label="Olustur" @click="onBtnClick"></Button>
      </div>

    </div>
  </Dialog>
</template>

<script>
import PeerService from "@/service/PeerService";
import EventService from "@/service/EventService";

const SUMMARY = 'Kontrat Konfigürasyonu';

export default {
  name: "ChaincodeConfigDialog",
  props: ['visible', `channels`],
  created() {
    this.eventService = new EventService(this, SUMMARY);
    this.getPackages();
  },
  methods: {
    onBtnClick() {
      this.$emit('close-dialog');
      this.$emit(`create-cc`, {
        channelId: this.selectedChannel.label,
        ccName: this.ccName,
        version: this.version,
        seq: this.seq,
        packageName: this.selectedPackage.label
      })
    },
    async getPackages() {
      try {
        this.packages = await PeerService.getPackages();
      } catch (e) {
        this.eventService.fail('Kontrat Paketleri Çekilirken Bir Hata Oluştu');
      }
    }
  },
  data() {
    return {
      display: false,
      channelId: ``,
      ccName: ``,
      version: ``,
      seq: ``,
      packageName: ``,
      packages: [],
      selectedPackage: null,
      selectedChannel: null,
      eventService: null
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