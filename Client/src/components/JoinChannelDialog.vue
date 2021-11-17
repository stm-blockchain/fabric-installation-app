<template>
  <Dialog v-model:visible="display" @hide="onHide" @show="clear" style="width: 80%">
    <template #header>Yeni Kanala Katıl</template>
    <div class="p-grid">
      <div class="p-col-6">
        <h6 class="p-text-left">Yeni Kanal Adı</h6>
        <div class="p-inputgroup">
          <InputText v-model.trim="newChannelName" placeholder="Yeni Kanal Adı"
                     @input="v$.newChannelName.$touch()" :class="{ 'p-invalid': v$.newChannelName.$error}"/>
        </div>
        <p class="p-invalid p-text-left p-mt-2" v-if="v$.newChannelName.$error" style="color: red; font-size: 0.75em">
          Yeni Kanal Adı girilmesi zorunludur</p>
      </div>

      <div class="p-col-6" >
        <h6 class="p-text-left">Orderer Bilgleri</h6>
        <div class="p-col padding-zero p-inputgroup">
          <div class="p-col padding-left-zero">
            <div class="p-inputgroup">
              <InputText v-model.trim="ordererAddress" placeholder="Orderer Adresi"
                         @input="v$.ordererAddress.$touch()" :class="{ 'p-invalid': v$.ordererAddress.$error}"/>
            </div>
            <p class="p-invalid p-text-left p-mt-2" v-if="v$.ordererAddress.$error"
               style="color: red; font-size: 0.75em">Orderer IP adresi ve portu aralarına ' : ' konarak girilmesi
              zorunludur</p>
          </div>
          <div class="p-col padding-left-zero">
            <div class="p-inputgroup">
              <InputText v-model.trim="ordererOrgName" placeholder="Orderder Org Adı"
                         @input="v$.ordererOrgName.$touch()" :class="{ 'p-invalid': v$.ordererOrgName.$error }"/>
            </div>
            <p class="p-invalid p-text-left p-mt-2" v-if="v$.ordererOrgName.$error"
               style="color: red; font-size: 0.75em">Orderder Org Adı girilmesi zorunludur</p>
          </div>
        </div>
      </div>

      <div class="p-col-9">
      </div>
      <div class="p-col-3 p-align-end">
        <Button label="Kanala Katıl" class="p-col-12" @click="onClick" :disabled="v$.$invalid"></Button>
      </div>
    </div>
  </Dialog>
</template>

<script>
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';

import EventService from "@/service/EventService";
import { EVENTS, validateNodeAddress } from "@/utilities/Utils";

const SUMMARY = "Kanal İşlemleri";

export default {
  name: "JoinChannelDialog",
  emits: [EVENTS.SHOW_PROGRESS_BAR, EVENTS.SHOW_TOAST, "close-dialog"],
  props: ["visible"],
  setup() {
    return { v$: useVuelidate() };
  },
  created() {
    this.eventService = new EventService(this, SUMMARY);
  },
  methods: {
    onHide() {
      // do work here
      this.$emit('close-dialog', {});
    },
    onClick() {
      this.$emit('close-dialog', {
        channelConfig: {
          ordererConfig: {
            ordererAddress: this.ordererAddress,
            ordererOrgName: this.ordererOrgName
          },
          channelName: this.newChannelName
        }
      });
    },
    clear() {
      this.newChannelName = '';
      this.ordererAddress = '';
      this.ordererOrgName = '';
      this.v$.$reset();
    }
  },
  data() {
    return {
      display: false,
      newChannelName: '',
      ordererAddress: '',
      ordererOrgName: '',
      eventService: null
    }
  },
  validations() {
    return {
      newChannelName: { required },
      ordererAddress: { required, validateNodeAddress },
      ordererOrgName: { required }
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
.padding-left-zero {
  padding-left: 0 !important;
  padding-top: 0 !important;
}

.padding-zero {
  padding: 0 !important;
}
</style>