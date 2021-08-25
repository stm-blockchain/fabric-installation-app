<template>
  <div class="p-grid">
    <div class="p-col p-text-center">

      <div class="p-card p-grid p-pb-2 p-mt-4 p-pl-3 p-pr-3">
        <div class="p-col-12" style="text-align: left; ">
          <h4 class="p-mt-2">Kanal İşlemleri</h4>
        </div>
        <div class="p-col-6">
          <h6 class="p-text-left">Düğümler</h6>
          <div class="p-inputgroup padding-left-zero">
            <Dropdown v-model="selectedPeer" :options="peers" optionLabel="label" placeholder="Düğüm Seçin" :disabled="peerDisabled"/>
          </div>
        </div>


        <div class="p-col-6">
          <h6 class="p-text-left">Kanallar</h6>
          <div class="p-inputgroup padding-left-zero">
            <Dropdown v-model="selectedChannel" :options="channels" optionLabel="label" placeholder="Kanal Seçin" :disabled="channelDisabled"/>
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
    </div>
  </div>
</template>

<script>
import PeerService from "@/service/PeerService";
import { INIT_ITEMS } from "@/utilities/Utils";

const JOIN_CHANNEL = 'Yeni Bir Kanala Katıl';

export default {
  name: "JoinChannel",
  mounted() {
    this.clear();
    this.getPeers();
  },
  data() {
    return {
      selectedPeer: null,
      selectedChannel: null,
      newChannelName: '',
      ordererAddress: '',
      ordererOrgName: '',
      peers: [],
      channels: [{label: JOIN_CHANNEL}],
      btnMsg: 'Sonraki Adım',
      peerExists: false,
      btnDisabled: true,
      peerDisabled: true,
      channelDisabled: true,
      showJoinChannelInput: false
    }
  },
  methods: {
    async getPeers() {
      try {
        this.peers = await PeerService.getPeers();
        this.peers.forEach(i => {
          i.label = `${i.peerName}.${i.orgName}.com`;
        });
      } catch (e) {
        alert(`Error: ${e.message}`);
      } finally {
        this.peerDisabled = this.peers.length === 0;
      }
    },
    clear() {
      this.peers = [];
      this.channels = [{label: JOIN_CHANNEL}];
      this.peerDisabled = true;
      this.channelDisabled = true;
      this.btnDisabled = true;
    },
    onBackBtnClick() {
      if (this.showJoinChannelInput) {
        this.send();
      } else {
        this.$router.push({name: 'chaincode'})
      }
    },
    generateReqBody() {
      return {
        peerConfig: {
          peerName: this.selectedPeer.peerName,
          orgName: localStorage.getItem(INIT_ITEMS.ORG_NAME)
        },
        ordererConfig: {
          ordererAddress: this.ordererAddress,
          ordererOrgName: this.ordererOrgName
        },
        channelName: this.newChannelName
      }
    },
    async send() {
      try {
        const body = this.generateReqBody();
        await PeerService.joinChannel(body);
        this.channels.push({label: this.newChannelName});
        this.selectedChannel = {label: this.newChannelName};
        alert(`Success`)
      } catch (e) {
        alert(`Error: ${e.message}`);
      }
    }
  },
  watch: {
    selectedPeer: async function(newPeer) { // watch it
      if (this.channelDisabled) this.channelDisabled = false;
      this.channels = [{label: JOIN_CHANNEL}];
      const channels = await PeerService.queryChannel(newPeer.peerName);
      channels.forEach(i => {
        this.channels.push(i);
      })
    },
    selectedChannel: function(newChannel) { // watch it
      console.log(newChannel)
      console.log(this.channels)
      this.btnDisabled = false;
      if(newChannel.label === JOIN_CHANNEL) {
        this.showJoinChannelInput = true;
        this.btnMsg = 'Kanala Katıl'
        this.newChannelName = '';
        this.ordererOrgName = '';
        this.ordererAddress = '';
      } else {
        this.showJoinChannelInput = false;
        this.btnMsg = 'Sonraki Adım';
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