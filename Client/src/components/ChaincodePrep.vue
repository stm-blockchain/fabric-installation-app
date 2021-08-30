<template>
  <ChaincodeConfigDialog :channels="channels" :visible="showConfigDialog" @close-dialog="showConfigDialog=false" @create-cc="setConfig"/>
  <ChaincodeNewEndorserDialog :visible="showNewEndorserDialog" @close-dialog="showNewEndorserDialog=false"/>
  <div class="p-grid">
    <div class="p-col-6 padding-left-zero">
      <h6 class="p-text-left p-mt-2">Düğümler</h6>
      <div class="p-inputgroup padding-left-zero">
        <Dropdown v-model="selectedPeer" :options="peers" class="p-mr-2" optionLabel="label" placeholder="Düğüm Seçin"/>
      </div>
    </div>

    <div class="p-col-6 padding-zero p-mt-2 ">
      <h6 class="p-text-left p-ml-2">Orderer Bilgleri</h6>
      <div class="p-col padding-zero p-inputgroup p-ml-2">
        <div class="p-col padding-left-zero p-inputgroup">
          <InputText v-model="ordererAddress" placeholder="Orderer Adresi"/>
        </div>
        <div class="p-col padding-left-zero p-inputgroup">
          <InputText v-model="orderderOrg" placeholder="Orderder Org Adı"/>
        </div>
      </div>
    </div>

    <div class="p-col-6 p-grid p-mt-2" style="height: max-content">
      <h6 class="p-text-left">Chaincode Konfigürasyonlari</h6>
      <DataTable :value="configParameters" class="border" >
        <Column field="type" class="p-text-bold"></Column>
        <Column field="value"></Column>
      </DataTable>
      <div class="p-col"></div>
      <div class="p-col padding-zero ">
        <Button class="p-col-12 p-mt-4" icon="pi pi-plus-circle" label="Yeni Akıllı Kontrat Yükle" @click="onConfigBtnClick"></Button>
      </div>
    </div>

    <div class="p-col-6 p-grid p-mt-2 p-ml-3" v-if="showEndorserTable"  style="height: max-content; top: 0">
      <h6 class="p-text-left">Chaincode'un Koşacağı Düğümler</h6>
      <DataTable :value="peerParameters" class="border">
        <Column field="type" header="Hello"></Column>
        <Column field="value" header="Hello"></Column>
      </DataTable>
      <div class="p-col-9"></div>
      <div class="p-col-3 padding-zero ">
        <Button class="p-col-12 p-mt-4" icon="pi pi-plus-circle" label="Yeni Peer" @click="onEndorserBtnClick"></Button>
      </div>
    </div>

    <div class="p-col-9"></div>

    <div class="p-col-3">
      <Button class="p-col-12 p-pl-4 p-pr-4" :label="btnMsg" @click="finishPreparation"></Button>
    </div>

  </div>
</template>

<script>
import ChaincodeConfigDialog from "@/components/ChaincodeConfigDialog";
import ChaincodeNewEndorserDialog from "@/components/ChaincodeNewEndorserDialog";
import PeerService from "../service/PeerService";
import {INIT_ITEMS} from "../utilities/Utils";

export default {
  name: "ChaincodePrep",
  components: {
    'ChaincodeConfigDialog': ChaincodeConfigDialog,
    'ChaincodeNewEndorserDialog': ChaincodeNewEndorserDialog
  },
  data() {
    return {
      showNewEndorserDialog: false,
      showConfigDialog: false,
      displayBasic: false,
      configParameters: [
        {type: 'Channel', value:  `-`},
        {type: 'Chaincode', value:  `-`},
        {type: 'Version', value:  `-`},
        {type: 'Sekans No', value:  `-`},
        {type: 'Paket', value:  `-`},
      ],
      peerParameters: [
        {type: '0.0.0.0:7052', value: 'Org1'},
        {type: '0.0.0.0:7052', value: 'Org1'},
        {type: '0.0.0.0:7052', value: 'Org1'},
        {type: '0.0.0.0:7052', value: 'Org1'},
      ],
      btnMsg: this.showEndorserTable ? `Sun` : `Chaincode Hazirligini Tamamla`,
      peers: [],
      selectedPeer: null,
      ordererAddress: ``,
      orderderOrg: ``,
      config: {
        channelId: `-`,
        ccName: `-`,
        version: `-`,
        seq: `-`,
        packageName: `-`
      },
      channels: []
    }
  },
  methods: {
    init() {
      this.getPeers();
    },
    finishPreparation() {
      this.send();
    },
    async getPeers() {
      try {
        this.channels = []
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
    onConfigBtnClick() {
      this.showConfigDialog = true;
      console.log(this.showConfigDialog);
    },
    onEndorserBtnClick() {
      this.showNewEndorserDialog = true;
      console.log(this.showNewEndorserDialog);
    },
    setConfig(cfg) {
      this.config = cfg;
      console.log(cfg)
      this.configParameters = [
        {type: 'Channel', value: this.config.channelId},
        {type: 'Chaincode', value: this.config.ccName},
        {type: 'Version', value: this.config.ccName},
        {type: 'Sekans No', value: this.config.seq},
        {type: 'Paket', value: this.config.packageName}]
    },
    generateReqBody() {
      return {
        peerConfig: {
          peerName: this.selectedPeer.peerName,
          orgName: localStorage.getItem(INIT_ITEMS.ORG_NAME)
        },
        chaincodeConfig: {
          ordererAddress: this.ordererAddress,
          ordererOrgName: this.ordererOrgName,
          channelId: this.config.channelId,
          ccName: this.config.ccName,
          version: this.config.version,
          seq: this.config.seq,
          packageName: this.config.packageName
        }
      }
    },
    async send() {
      try {
        const body = this.generateReqBody();
        await PeerService.prepareCommit(body);
        this.clearConfig();
        alert(`Success`);
      } catch (e) {
        alert(`Error: ${e.message}`);
      }
    },
    clearConfig() {
      this.config = {
        channelId: `-`,
        ccName: `-`,
        version: `-`,
        seq: `-`,
        packageName: `-`
      };
      this.configParameters = [
        {type: 'Channel', value:  `-`},
        {type: 'Chaincode', value:  `-`},
        {type: 'Version', value:  `-`},
        {type: 'Sekans No', value:  `-`},
        {type: 'Paket', value:  `-`},
      ]
    }
  },
  props: {
    showEndorserTable: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
    this.init();
  },
  watch: {
    selectedPeer: async function(newPeer) { // watch it
      this.channels = [];
      const channels = await PeerService.queryChannel(newPeer.peerName);
      channels.forEach(i => {
        this.channels.push(i);
      })
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

::v-deep th {
  display: none !important;
  /*border: solid #ced4da;*/
  /*border-width: 0 1px 0 0;*/
  /*border-radius: 3px;*/
}

::v-deep .p-datatable .p-datatable-tbody > tr > td {
  border: solid #ced4da;;
  border-width: 0 1px 1px 0 ;
}

.border {
  border: solid #ced4da ;
  border-width: 1px 1px 0 1px ;
  border-radius: 3px;
}
</style>