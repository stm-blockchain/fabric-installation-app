<template>
  <Dialog v-model:visible="display" @hide="onHide" @show="init" style="width: 80%">
    <template #header>
      Chaincode Bilgileri
    </template>
    <div class="p-grid p-pb-2 ">
      <div class="p-col-6">
        <h6 class="p-text-left">Paket</h6>
        <div class="p-inputgroup padding-left-zero">
          <Dropdown v-model="selectedPackage" :options="packages" optionLabel="label" placeholder="Paket Seçin"/>
        </div>
      </div>

      <div class="p-col-6" >
        <h6 class="p-text-left">Orderer Bilgleri</h6>
        <div class="p-col padding-zero p-inputgroup">
          <div class="p-col padding-left-zero">
            <div class="p-inputgroup">
              <InputText v-model="ordererAddress" placeholder="Orderer Adresi" @input="v$.ordererAddress.$touch()"
                         :class="{ 'p-invalid': v$.ordererAddress.$error}"/>
            </div>
            <p class="p-invalid p-text-left p-mt-2" v-if="v$.ordererAddress.$error"
               style="color: red; font-size: 0.75em">Orderer IP adresi ve portu aralarına ' : ' konarak girilmesi
              zorunludur</p>
          </div>
          <div class="p-col padding-left-zero">
            <div class="p-inputgroup">
              <InputText v-model="ordererOrgName" placeholder="Orderder Org Adı" @input="v$.ordererOrgName.$touch()"
                         :class="{ 'p-invalid': v$.ordererOrgName.$error}"/>
            </div>
            <p class="p-invalid p-text-left p-mt-2" v-if="v$.ordererOrgName.$error"
               style="color: red; font-size: 0.75em">Orderder Org Adı girilmesi zorunludur</p>
          </div>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Chaincode Adı</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText v-model="ccName" placeholder="Chaincode Adı" :disabled="true"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Chaincode Versiyonu</h6>
        <div class="padding-left-zero p-inputgroup">
          <InputText v-model="version" placeholder="Chaincode Versiyonu" :disabled="true"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Sekans No</h6>
        <div class="padding-left-zero">
          <div class="p-inputgroup">
            <InputText v-model="seq" placeholder="Sekans No" @input="v$.seq.$touch()"
                       :class="{ 'p-invalid': v$.seq.$error}"/>
          </div>
          <p class="p-invalid p-text-left p-mt-2" v-if="v$.seq.$error"
             style="color: red; font-size: 0.75em">Sekans numarasının sayı olarak girilmesi zorunludur</p>
        </div>
      </div>

      <div class="p-col-9">
      </div>

      <div class="p-col-3 p-align-end">
        <Button class="p-col-12" label="Olustur" @click="onBtnClick" :disabled="v$.$invalid"></Button>
      </div>

    </div>
  </Dialog>
</template>

<script>
import useVuelidate from '@vuelidate/core';
import { required, numeric } from '@vuelidate/validators';

import PeerService from "@/service/PeerService";
import EventService from "@/service/EventService";
import { validateNodeAddress } from "@/utilities/Utils";

const SUMMARY = 'Kontrat Konfigürasyonu';

export default {
  name: "ChaincodeConfigDialog",
  props: ['visible'],
  setup() {
    return { v$: useVuelidate() };
  },
  created() {
    this.eventService = new EventService(this, SUMMARY);
  },
  methods: {
    init() {
      this.getPackages();
      this.clear();
    },
    onBtnClick() {
      this.$emit(`close-dialog`, {
        chaincodeConfig: {
          ccName: this.ccName,
          version: this.version,
          seq: this.seq,
          packageName: this.selectedPackage.label,
          ordererAddress: this.ordererAddress,
          ordererOrgName: this.ordererOrgName
        }
      });
    },
    onHide() {
      this.$emit('close-dialog', {});
    },
    async getPackages() {
      try {
        this.packages = await PeerService.getPackages();
      } catch (e) {
        this.eventService.fail('Kontrat Paketleri Çekilirken Bir Hata Oluştu');
      }
    },
    setChaincodeNameVersion(packageName) {
      const packageTokens = packageName.split("@");
      this.ccName = packageTokens[0];
      this.version = packageTokens[1].replace('.tar.gz', '');
    },
    clear() {
      this.ccName = '';
      this.version = '';
      this.ordererOrgName = '';
      this.ordererAddress = '';
      this.seq = '';
      this.packageName = '';
      this.selectedPackage = null;
      this.v$.$reset();
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
      ordererAddress: '',
      ordererOrgName: '',
      packages: [],
      selectedPackage: null,
      eventService: null
    }
  },
  validations() {
    return {
      ordererAddress: { required, validateNodeAddress },
      ordererOrgName: { required },
      seq: { required, numeric }
    };
  },
  watch: {
    visible: function (newValue) {
      this.display = newValue;
    },
    selectedPackage: function (newPackage) {
      if (newPackage) {
        console.log(newPackage);
        this.setChaincodeNameVersion(newPackage.label);
      }
    }
  }
}
</script>

<style scoped>
.padding-left-zero {
  padding-left: 0 !important;
  padding-top: 0 !important;
}

.padding-zero {
  padding: 0 !important;
}
</style>