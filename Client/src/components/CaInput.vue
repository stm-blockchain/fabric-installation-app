<template>
  <div class="p-grid">
    <div class="p-col p-text-center">
      <div class="p-card p-grid p-pb-2">
        <div class="p-col-12" style="text-align: left; ">
          <h4 class="p-mt-2">{{ title }}</h4>
        </div>
        <div class="p-col-6">
          <h6 class="p-text-left">Sunucu Admini Kullanıcı Adı<span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model.trim="userName" placeholder="Kullanıcı adı girin" :disabled="isDisabled"
              @input="v$.userName.$touch()" :class="{ 'p-invalid': v$.userName.$error}"/>
          </div>
          <div class="p-invalid p-text-left p-mt-2" v-if="v$.userName.$error" style="color: red; font-size: 0.75em">*
            ile işaretlenen alanlar CA sunucusunun
            oluşturulabilmesi için zorunludur
          </div>
        </div>

        <div class="p-col-6">
          <h6 class="p-text-left">Sunucu Admini Şifre <span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText type="password" v-model.trim="password" placeholder="Şifre girin" :disabled="isDisabled"
                       @input="v$.password.$touch()" :class="{ 'p-invalid': v$.password.$error}"/>
          </div>
          <div class="p-invalid p-text-left p-mt-2" v-if="v$.password.$error" style="color: red; font-size: 0.75em">*
            ile işaretlenen alanlar CA sunucusunun
            oluşturulabilmesi için zorunludur
          </div>
        </div>

        <div class="p-col-6" v-show="!isTls">
          <h6 class="p-text-left">Kurum Admini Kullanıcı Adı<span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model.trim="v$.adminName.$model" placeholder="Kullanıcı adı girin" :disabled="isDisabled"
                       @input="v$.adminName .$touch()" :class="{ 'p-invalid': v$.adminName.$error}"/>
          </div>
          <div class="p-invalid p-text-left p-mt-2" v-if="v$.adminName.$error" style="color: red; font-size: 0.75em">*
            ile işaretlenen alanlar CA sunucusunun
            oluşturulabilmesi için zorunludur
          </div>
        </div>

        <div class="p-col-6" v-show="!isTls">
          <h6 class="p-text-left">Kurum Admini Şifre <span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText type="password" v-model.trim="adminSecret" placeholder="Şifre girin" :disabled="isDisabled"
                       @input="v$.adminSecret.$touch()" :class="{ 'p-invalid': v$.adminSecret.$error}"/>
          </div>
          <div class="p-invalid p-text-left p-mt-2" v-if="v$.adminSecret.$error" style="color: red; font-size: 0.75em">*
            ile işaretlenen alanlar CA sunucusunun
            oluşturulabilmesi için zorunludur
          </div>
        </div>

        <div class="p-col-6">
          <h6 class="p-text-left">Host Adresleri<span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model.trim="hostAddresses" placeholder="eg. 172.20.20.82,*.Org1.com,..." :disabled="isDisabled"
                       @input="v$.hostAddresses.$touch()" :class="{ 'p-invalid': v$.hostAddresses.$error}"/>
          </div>
          <div class="p-invalid p-text-left p-mt-2" v-if="v$.hostAddresses.$error" style="color: red; font-size: 0.75em">* ile işaretlenen alanlar CA sunucusunun
            oluşturulabilmesi için zorunludur
          </div>
        </div>

        <div class="p-col-6">
          <h6 class="p-text-left">Port<span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model.trim="port" placeholder="eg. 7052" :disabled="isDisabled"
                       @input="v$.port.$touch()" :class="{ 'p-invalid': v$.port.$error}"/>
          </div>
          <div class="p-invalid p-text-left p-mt-2" v-if="v$.port.$error" style="color: red; font-size: 0.75em">*
            ile işaretlenen alanlar CA sunucusunun
            oluşturulabilmesi için zorunludur
          </div>
        </div>
        <div class="p-col-6">
        </div>

        <div class="p-col-3">
          <Button label="Önceki Adım" class="p-button-outlined p-col-12"
                  icon="pi pi-arrow-circle-left" @click="onBackBtnClick" />
        </div>

        <div class="p-col-3">
          <Button :label="btnMsg" class="p-col-12" :icon="showForwardIcon()" @click="onNextStepClick"
                  :disabled="v$.$invalid"></Button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import useVuelidate from '@vuelidate/core'
import { required, requiredIf, numeric } from '@vuelidate/validators'

import { INIT_ITEMS, EVENTS, validateHostAddress } from "@/utilities/Utils";
import CaService from "@/service/CaService";
import EventService from "../service/EventService";

const SUMMARY = 'Ca Sunucu Oluştur';

export default {
  name: "CaInput",
  setup() {
    return { v$: useVuelidate() };
  },
  data() {
    return {
      btnMsg: '',
      isTls: false,
      userName: '',
      password: '',
      adminName: '',
      adminSecret: '',
      hostAddresses: '',
      port: '',
      isDisabled: false,
      title: '',
      eventService: null
    }
  },
  validations() {
    return {
      userName: { required },
      password: { required },
      adminName: { requiredIfOrg: requiredIf(!this.isTls) },
      adminSecret: { requiredIfOrg: requiredIf(!this.isTls) },
      hostAddresses: { required, validateHostAddress },
      port: { required, numeric }
    }
  },
  created() {
    this.eventService = new EventService(this, SUMMARY);
  },
  mounted() {
    this.initTls();
  },
  methods: {
    initTls() {
      this.clear();
      this.isTls = true;
      this.title = 'TLS CA Sunucu Bilgilerini Girin';
      if (localStorage.getItem(INIT_ITEMS.TLS_CA)) {
        this.isDisabled = true;
        const tlsCa = JSON.parse(localStorage.getItem(INIT_ITEMS.TLS_CA));
        this.userName = tlsCa.userName;
        this.password = tlsCa.password;
        this.port = tlsCa.port;
        this.hostAddresses = tlsCa.csrHosts;
        this.btnMsg = 'Sonraki Adım'
      }
      this.isDisabled ? this.btnMsg = 'Sonraki Adım' : this.btnMsg = 'TLS Sunucusu Oluştur';
    },
    initOrg() {
      this.clear();
      this.isTls = false;
      this.title = 'ORG CA Sunucu Bilgilerini Girin';
      if (localStorage.getItem(INIT_ITEMS.ORG_CA)) {
        this.isDisabled = true;
        const orgCa = JSON.parse(localStorage.getItem(INIT_ITEMS.ORG_CA));
        this.userName = orgCa.userName;
        this.password = orgCa.password;
        this.adminName = orgCa.adminName;
        this.adminSecret = orgCa.adminSecret;
        this.port = orgCa.port;
        this.hostAddresses = orgCa.csrHosts;
      }
      this.isDisabled ? this.btnMsg = 'Sonraki Adım' : this.btnMsg = 'Org Ca Sunucusu Olutur'
    },
    showForwardIcon() {
      return this.isDisabled ? 'pi pi-arrow-circle-right' : '';
    },
    onNextStepClick() {
      if (!this.isDisabled) {
        this.send();
      } else this.navigate();
      this.v$.$reset();
    },
    navigate() {
      if (this.isTls) {
        this.initOrg();
      } else {
        this.$emit(EVENTS.SHOW_TOP_BAR_ITEMS);
        this.$router.push({name: 'peerOperations'});
      }
    },
    onBackBtnClick() {
      if (!this.isTls) {
        this.initTls();
      } else this.$emit(EVENTS.HIDE_APP);
    },
    generateReqBody() {
      return {
        userName: this.userName,
        password: this.password,
        port: this.port,
        isTls: this.isTls,
        orgName: localStorage.getItem(INIT_ITEMS.ORG_NAME),
        csrHosts: this.hostAddresses,
        adminName: this.adminName,
        adminSecret: this.adminSecret
      }
    },
    async send() {
      try {
        this.eventService.showProgress(true);
        const reqData = this.generateReqBody();
        this.isTls ? localStorage.setItem(INIT_ITEMS.TLS_CA, JSON.stringify(reqData)) :
            localStorage.setItem(INIT_ITEMS.ORG_CA, JSON.stringify(reqData));
        await CaService.startUpCaServer(reqData);
        this.clear();
        this.eventService.success(`${this.isTls ? 'TLS CA Sunucusu Başarıyla Oluşturuldu'
            : 'ORG CA Sunucusu Başarıyla Oluşturuldu'}`);
        await new Promise(r => setTimeout(r, 500));
        this.navigate();
      } catch (e) {
        console.log(e);
        this.eventService.fail(`${this.isTls ? 'TLS CA Sunucusu Oluşturma İşlemi Başarısız'
            : 'ORG CA Sunucusu Oluşturma İşlemi Başarısız'}`);
      }
    },
    clear() {
      this.isDisabled = false;
      this.userName = '';
      this.password = '';
      this.adminName = '';
      this.adminSecret = '';
      this.hostAddresses = '';
      this.port = '';
    }
  }
}
</script>

<style scoped>
</style>
