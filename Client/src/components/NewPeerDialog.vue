<template>
  <Dialog v-model:visible="display" @hide="onHide" style="width: 80%">
    <template #header>
      Peer Bilgileri
    </template>
    <div class="p-grid p-pb-2">
      <div class="p-col-6">
        <h6 class="p-text-left">Peer Adı<span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText v-model="peerName" placeholder="Kullanıcı adı girin"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Peer Şifre <span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText type="password" v-model="password" placeholder="Şifre girin"/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Host Adresleri<span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText v-model="csrHosts" placeholder="eg. 172.20.20.82,*.Org1.com,..."/>
        </div>
      </div>

      <div class="p-col-6">
        <h6 class="p-text-left">Port<span style="color:red;"> *</span></h6>
        <div class="p-inputgroup">
          <InputText v-model="port" placeholder="eg. 7052"/>
        </div>
      </div>
      <div class="p-col-12 p-text-left" style="color: red; font-size: 0.75em">* ile işaretlenen alanlar CA sunucusunun
        oluşturulabilmesi için zorunludur
      </div>
      <div class="p-col-9">
      </div>

      <div class="p-col-3">
        <Button label="Düğüm Oluştur" class="p-col-12" @click="onClick"></Button>
      </div>
    </div>
  </Dialog>
</template>

<script>
import EventService from "../service/EventService";
import {EVENTS, INIT_ITEMS} from "@/utilities/Utils";

const SUMMARY = 'Yeni Düğüm';
export default {
  name: "NewPeerDialog",
  props: ['visible'],
  emits: [EVENTS.SHOW_PROGRESS_BAR, EVENTS.SHOW_TOAST, "close-cc", "close-dialog"],
  created() {
    this.eventService = new EventService(this, SUMMARY);
    this.clear();
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