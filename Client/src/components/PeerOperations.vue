<template>
  <div>
    <NewPeerDialog :visible="showNewPeerDialog" @close-dialog="onNewPeerDialogClosed"/>
    <JoinChannelDialog :visible="showNewChannelDialog" @close-dialog="onNewChannelDialogClosed"/>
    <div class="p-grid p-pb-6">
      <div class="p-col-12 p-text-center">
        <div class="p-toolbar background-white">
          <div class="p-tooltip-left">
            <h4 class="p-d-inline">Organizasyonda Tanımlı Düğümler</h4>
          </div>
          <Button icon="pi pi-plus" iconPos="right" label="Yeni Düğüm" @click="onNewPeerClick"></Button>
          <DataTable :value="peers" class="border p-mt-4" v-model:selection="selectedPeer" selectionMode="single"
                     data-key="peerName">
            <Column field="peerName" header="Düğüm Adı"></Column>
            <Column field="port" header="Port"></Column>
            <Column field="host" header="Host Adresi"></Column>
          </DataTable>
        </div>
      </div>
      <div class="p-col-12" v-show="showDetails">
        <div class="p-card p-grid p-m-0  p-text-center p-col">
          <h4 class="p-col-12">Kanallar</h4>
          <div class="p-col-9">
            <h6 class="p-text-left p-mt-2 p-text-bold" v-text="channelsTitle()"></h6>
          </div>
          <div class="p-col-3 p-text-right">
            <Button class="p-text-right" icon="pi pi-plus" iconPos="right" label="Yeni Kanala Katıl"
                    @click="showNewChannelDialog=true"></Button>
          </div>
          <DataTable :value="channels" class="border p-mt-2 p-mb-6" v-model:selection="selectedChannel"
                     selectionMode="single"
                     data-key="channelName">
            <Column field="label" header="Kanal Adı"></Column>
          </DataTable>
          <div class="p-grid p-m-0" v-show="showChaincodeDetails">
            <div class="p-col-9">
              <h6 class="p-text-left p-mt-2 p-text-bold">Kanal 2 Yüklü Akıllı Kontratlar</h6>
            </div>
            <div class="p-col-3 p-text-right p-m-0">
              <Button icon="pi pi-plus" iconPos="right" label="Yeni Akıllı Kontrat Yükle"></Button>
            </div>
            <DataTable :value="chaincodes" class="border p-mt-2">
              <Column field="name" header="Akıllı Kontrat Adı"></Column>
              <Column field="version" header="Versiyonu"></Column>
              <Column field="sequence" header="Sekans No"></Column>
              <Column field="state" header="Durumu"></Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PeerService from "@/service/PeerService";
import EventService from "@/service/EventService";
import NewPeerDialog from "@/components/NewPeerDialog";
import JoinChannelDialog from "@/components/JoinChannelDialog";
import {EVENTS, INIT_ITEMS} from "@/utilities/Utils";

const SUMMARY = "Düğüm İşlemleri";

export default {
  name: "PeerOperations",
  emits: [EVENTS.SHOW_PROGRESS_BAR, EVENTS.SHOW_TOAST],
  components: {
    'NewPeerDialog': NewPeerDialog,
    'JoinChannelDialog': JoinChannelDialog
  },
  created() {
    this.eventService = new EventService(this, SUMMARY);
    this.getPeers();
  },
  methods: {
    channelsTitle() {
      return this.selectedPeer ? `${this.selectedPeer.peerName} Dahil Olunan Kanallar` : '';
    },
    onNewPeerClick() {
      this.showNewPeerDialog = true;
    },
    onNewPeerDialogClosed(data) {
      this.showNewPeerDialog = false;
      if (data.newPeerConfig) {
        this.sendNewPeer(data.newPeerConfig);
      }
    },
    onNewChannelDialogClosed(data) {
      this.showNewChannelDialog = false;
      if (data.channelConfig) {
        data.channelConfig.peerConfig = {
          peerName: this.selectedPeer.peerName,
          orgName: this.selectedPeer.orgName
        }
        this.sendNewChannel(data.channelConfig);
      }
    },
    async getPeers() {
      this.eventService.showProgress(true);
      try {
        this.peers = await PeerService.getPeers();
        this.eventService.showProgress(false);
      } catch (e) {
        this.eventService.fail('Düğümler Çekilirken Hata Oluştu');
      }
    },
    async getChannels(peer) {
      try {
        this.eventService.showProgress(true);
        const channels = await PeerService.queryChannel({
          peerConfig: {
            peerName: peer.peerName,
            orgName: localStorage.getItem(INIT_ITEMS.ORG_NAME)
          }
        });
        this.channels = [];
        channels.forEach(i => {
          this.channels.push(i);
        });
        this.eventService.showProgress(false);
        this.showDetails = true;
        this.showChaincodeDetails = false;
      } catch (e) {
        this.eventService.fail(`${peer.peerName} Düğümünün Katıldığı Kanalları Çekme İşlemi Başarısız`);
      }
    },
    async getChaincodes(channel) {
      try {
        this.eventService.showProgress(true);
        this.chaincodes = await PeerService.chaincodeStates({
          channelName: channel.label,
          peerConfig: {
            peerName: this.selectedPeer.peerName,
            orgName: this.selectedPeer.orgName
          }
        });
        this.eventService.showProgress(false);
        this.showChaincodeDetails = true;
      } catch (e) {
        this.eventService.fail(`${this.selectedChannel.label} kanalında bulunan akıllı kontratları çekerken bir hata oluştu`)
      }
    },
    async sendNewPeer(body) {
      try {
        this.eventService.showProgress(true);
        await PeerService.createPeer(body);
        this.peers = await PeerService.getPeers();
        this.eventService.success('Yeni Peer Oluşturma İşlemi Başarılı');
      } catch (e) {
        this.eventService.fail('Yeni Peer Oluşturma İşlemi Başarısız');
      }
    },
    async sendNewChannel(data) {
      try {
        this.eventService.showProgress(true);
        await PeerService.joinChannel(data);
        const channels = await PeerService.queryChannel({
          peerConfig: {
            peerName: this.selectedPeer.peerName,
            orgName: localStorage.getItem(INIT_ITEMS.ORG_NAME)
          }
        });
        this.channels = [];
        channels.forEach(i => {
          this.channels.push(i);
        });
        this.eventService.success(`Kanala Katılma İşlemi Başarılı: ${data.channelName}`);
      } catch (e) {
        this.eventService.fail(`Kanala Katılma İşlemi Başarısız: ${data.channelName}`);
      }
    }
  },
  data() {
    return {
      peers: [],
      channels: [],
      chaincodes: [],
      selectedPeer: null,
      selectedChannel: null,
      eventService: null,
      showDetails: false,
      showChaincodeDetails: false,
      showNewPeerDialog: false,
      showNewChannelDialog: false
    }
  },
  watch: {
    selectedPeer: async function (newPeer) { // watch it
      await this.getChannels(newPeer);
    },
    selectedChannel: async function (newChannel) {
      await this.getChaincodes(newChannel);
    }
  }
}
</script>

<style scoped>
.border {
  border: 1px solid #ced4da;
  /*border-radius: 3px;*/
}

.background-white {
  background-color: white;
}

</style>