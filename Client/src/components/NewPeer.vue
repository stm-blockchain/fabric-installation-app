<template>
  <div class="p-grid">
    <div class="p-col p-text-center">
      <div class="p-toolbar p-text-left p-grid">
        <div class="p-toolbar-gropup-left p-col-12">
          <h4 class="p-d-inline">{{ title }}</h4>
          <SplitButton class="p-ml-2 p-ripple" :label="splitLabel" icon="pi pi-check" :model="items"></SplitButton>
        </div>
      </div>

      <div class="p-card p-grid p-pb-2 p-mt-4 p-pl-3 p-pr-3">
        <div class="p-col-12" style="text-align: left; ">
          <h4 class="p-mt-2">Peer Bilgielri</h4>
        </div>
        <div class="p-col-6">
          <h6 class="p-text-left">Peer Adı<span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model="peerName" placeholder="Kullanıcı adı girin" :disabled="isDisabled"/>
          </div>
        </div>

        <div class="p-col-6">
          <h6 class="p-text-left">Peer Şifre <span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model="password" placeholder="Şifre girin" :disabled="isDisabled"/>
          </div>
        </div>

        <div class="p-col-6">
          <h6 class="p-text-left">Host Adresleri<span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model="csrHosts" placeholder="eg. 172.20.20.82,*.Org1.com,..." :disabled="isDisabled"/>
          </div>
        </div>

        <div class="p-col-6">
          <h6 class="p-text-left">Port<span style="color:red;"> *</span></h6>
          <div class="p-inputgroup">
            <InputText v-model="port" placeholder="eg. 7052" :disabled="isDisabled"/>
          </div>
        </div>
        <div class="p-col-12 p-text-left" style="color: red; font-size: 0.75em">* ile işaretlenen alanlar CA sunucusunun
          oluşturulabilmesi için zorunludur
        </div>
        <div class="p-col-9">
        </div>

        <div class="p-col-3">
          <Button :label="btnMsg" class="p-col-12" @click="onClick"></Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PeerService from "@/service/PeerService";
import {EVENTS, INIT_ITEMS, RESPONSE_STATE} from "@/utilities/Utils";

const SUMMARY = 'Yeni Düğüm';

export default {
  name: "NewPeer",
  data() {
    return {
      title: 'Peer Seçin: ',
      isDisabled: false,
      isSelected: false,
      items: [],
      itemNewPeer: {
        label: 'Yeni Düğüm',
        command: () => {
          this.newPeer();
        }
      },
      splitLabel: 'Yeni Düğüm',
      btnMsg: 'Düğüm Oluştur',
      peerName: '',
      password: '',
      orgName: localStorage.getItem(INIT_ITEMS.ORG_NAME),
      port: '',
      csrHosts: ''
    }
  },
  async mounted() {
    try {
      this.showProgess(true);
      this.clearItems();
      const data = await PeerService.getPeers();
      this.setItems(data);
      this.showProgess(false);
    } catch (e) {
      this.fail('Düğümler Çekilirken Hata Oluştu');
    }
  },
  methods: {
    onClick() {
      if (this.isSelected) {
        // send here
        this.$router.push({name: 'joinChannel'})
      } else this.sendNewPeer();
    },
    setLabel(label) {
      this.splitLabel = label;
    },
    setItems(data) {
      if (data.length === 0) {
        return ;
      }

      data.forEach(i => {
        const label = `${i.peerName}.${this.orgName}.com`;
        i.label = label;
        i.command = () => {
          this.itemSelected(i, label);
        };
        this.items.push(i);
      })
    },
    showPeer(peer) {
      this.peerName = peer.peerName;
      this.password = peer.password;
      this.csrHosts = peer.csrHosts;
      this.port = peer.port;
      this.isDisabled = true;
    },
    clear() {
      this.peerName = '';
      this.password = '';
      this.csrHosts = '';
      this.port = '';
      this.isDisabled = false;
    },
    clearItems() {
      this.items = [];
      this.items.push(this.itemNewPeer);
    },
    itemSelected(item, label) {
      this.setLabel(label);
      this.showPeer(item);
      this.btnMsg = 'Sonraki Adım'
      this.isSelected = true;
    },
    newPeer() {
      this.isSelected = false;
      this.setLabel('Yeni DÜğüm');
      this.clear();
      this.btnMsg = 'Düğüm Oluştur'
    },
    generateReqBody() {
      return {
        peerName: this.peerName,
        password: this.password,
        orgName: this.orgName,
        port: this.port,
        csrHosts: this.csrHosts
      }
    },
    async sendNewPeer() {
      try {
        this.showProgess(true);
        const reqData = this.generateReqBody();
        await PeerService.createPeer(reqData);
        this.clear();
        this.success('Yeni Peer Oluşturma İşlemi Başarılı');
      } catch (e) {
        this.fail('Yeni Peer Oluşturma İşlemi Başarısız');
      }
    },
    showProgess(show) {
      this.$emit(EVENTS.SHOW_PROGRESS_BAR, show);
    },
    success(msg) {
      this.showProgess(false);
      this.$emit(EVENTS.SHOW_TOAST, {
        severity: RESPONSE_STATE.SUCCESS,
        summary: SUMMARY,
        detail: msg
      });
    },
    fail(msg) {
      this.showProgess(false);
      this.$emit(EVENTS.SHOW_TOAST, {
        severity: RESPONSE_STATE.ERROR,
        summary: SUMMARY,
        detail: msg
      });
    }
  }
}
</script>

<style scoped>

</style>