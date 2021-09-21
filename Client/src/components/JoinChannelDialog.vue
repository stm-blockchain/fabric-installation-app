<template>
  <Dialog v-model:visible="display" @hide="onHide" style="width: 80%">
    <template #header>Yeni Kanala Katıl</template>
    <div class="p-grid">
      <div class="p-col-6">
        <h6 class="p-text-left">Yeni Kanal Adı</h6>
        <div class="p-inputgroup">
          <InputText v-model="newChannelName" placeholder="Yeni Kanal Adı"/>
        </div>
      </div>

      <div class="p-col-6" >
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
        <Button label="Kanala Katıl" class="p-col-12" @click="onClick"></Button>
      </div>
    </div>
  </Dialog>
</template>

<script>
import EventService from "@/service/EventService";
import {EVENTS} from "@/utilities/Utils";

const SUMMARY = "Kanal İşlemleri";

export default {
  name: "JoinChannelDialog",
  emits: [EVENTS.SHOW_PROGRESS_BAR, EVENTS.SHOW_TOAST, "close-dialog"],
  props: ["visible"],
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