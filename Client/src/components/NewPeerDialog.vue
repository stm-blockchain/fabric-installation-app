<template>
  <Dialog v-model:visible="display" @hide="onHide" @show="clear" style="width: 80%">
    <template #header>
      Peer Bilgileri
    </template>
    <div class="p-grid p-pb-2">
      <div class="p-col-6">
        <h6 class="p-text-left">Peer Adı <span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText v-model.trim="peerName" placeholder="Kullanıcı adı girin"
                     @input="v$.peerName.$touch()" :class="{ 'p-invalid': v$.peerName.$error}"/>
        </div>
        <div class="p-invalid p-text-left p-mt-2" v-if="v$.peerName.$error" style="color: red; font-size: 0.75em">
          Peer Adı girilmesi zorunludur
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Peer Şifre <span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText type="password" v-model.trim="password" placeholder="Şifre girin"
                     @input="v$.password.$touch()" :class="{ 'p-invalid': v$.password.$error}"/>
        </div>
        <div class="p-invalid p-text-left p-mt-2" v-if="v$.password.$error" style="color: red; font-size: 0.75em">
          Peer Şifresi girilmesi zorunludur
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Host Adresleri<span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText v-model.trim="csrHosts" placeholder="eg. 172.20.20.82,*.Org1.com,..."
                     @input="v$.csrHosts.$touch()" :class="{ 'p-invalid': v$.csrHosts.$error}"/>
        </div>
        <div class="p-invalid p-text-left p-mt-2" v-if="v$.csrHosts.$error" style="color: red; font-size: 0.75em">
          Bir veya daha fazla host IP adresinin aralarına ',' konarak girilmesi zorunludur
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Port<span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText v-model.trim="port" placeholder="eg. 7052"
                     @input="v$.port.$touch()" :class="{ 'p-invalid': v$.port.$error}"/>
        </div>
        <div class="p-invalid p-text-left p-mt-2" v-if="v$.port.$error" style="color: red; font-size: 0.75em">
          Port girilmesi zorunludur
        </div>
      </div>

      <div class="p-col-9">
      </div>

      <div class="p-col-3">
        <Button label="Düğüm Oluştur" class="p-col-12" @click="onClick" :disabled="v$.$invalid"></Button>
      </div>
    </div>
  </Dialog>
</template>

<script>
import useVuelidate from '@vuelidate/core';
import { required, numeric } from '@vuelidate/validators';

import EventService from "../service/EventService";
import {EVENTS, INIT_ITEMS, validateHostAddress} from "@/utilities/Utils";

const SUMMARY = 'Yeni Düğüm';
export default {
  name: "NewPeerDialog",
  props: ['visible'],
  emits: [EVENTS.SHOW_PROGRESS_BAR, EVENTS.SHOW_TOAST, "close-cc", "close-dialog"],
  setup() {
    return { v$: useVuelidate() };
  },
  validations() {
    return {
      peerName: { required },
      password: { required },
      csrHosts: { required, validateHostAddress },
      port: { required, numeric }
    }
  },
  created() {
    this.eventService = new EventService(this, SUMMARY);
  },
  methods: {
    onHide() {
      this.$emit('close-dialog', {});
    },
    onClick() {
      this.$emit('close-dialog', {
        newPeerConfig: {
          peerName: this.peerName,
          password: this.password,
          orgName: this.orgName,
          port: this.port,
          csrHosts: this.csrHosts
        }
      });
    },
    clear() {
      this.peerName = '';
      this.password = '';
      this.csrHosts = '';
      this.port = '';
      this.isDisabled = false;
      this.v$.$reset();
    }
  },
  data() {
    return {
      display: false,
      peerName: '',
      password: '',
      orgName: localStorage.getItem(INIT_ITEMS.ORG_NAME),
      port: '',
      csrHosts: '',
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