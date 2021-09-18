<template>
<div class="p-grid p-pb-6">
  <div class="p-col-12 p-text-center">
    <div class="p-toolbar">
      <div class="p-tooltip-left">
        <h4 class="p-d-inline">Organizasyonda Tanımlı Düğümler</h4>
      </div>
      <Button icon="pi pi-plus" iconPos="right" label="Yeni Düğüm"></Button>
      <DataTable :value="peers" class="border p-mt-4" v-model:selection="selectedPeer" selectionMode="single" data-key="peerName">
        <Column field="peerName" header="Düğüm Adı"></Column>
        <Column field="port" header="Port"></Column>
        <Column field="host" header="Host Adresi"></Column>
      </DataTable>
    </div>
  </div>
  <div class="p-col-12">
    <div class="p-card p-grid p-m-0  p-text-center p-col">
      <h4 class="p-col-12">Kanallar</h4>
      <div class="p-col-9 p-m-0">
        <h6 class="p-text-left p-mt-2 p-text-bold">Peer1'in Katıldığı Kanallar</h6>
      </div>
      <div class="p-col-3 p-m-0">
        <Button class="p-align-end" icon="pi pi-plus" iconPos="right" label="Yeni Kanala Katıl"></Button>
      </div>
      <DataTable :value="channels" class="border p-mt-2 p-mb-6" v-model:selection="selectedCC" selectionMode="single" data-key="channelName">
        <Column field="channelName" header="Kanal Adı"></Column>
      </DataTable>
      <div class="p-col-9 p-m-0">
        <h6 class="p-text-left p-mt-2 p-text-bold">Kanal 2 Yüklü Akıllı Kontratlar</h6>
      </div>
      <div class="p-col-3 p-m-0">
        <Button class="p-align-end" icon="pi pi-plus" iconPos="right" label="Yeni Akıllı Kontrat Yükle"></Button>
      </div>
      <DataTable :value="chaincodes" class="border p-mt-2">
        <Column field="ccName" header="Akıllı Kontrat Adı"></Column>
        <Column field="version" header="Versiyonu"></Column>
        <Column field="sequence" header="Sekans No"></Column>
        <Column field="state" header="Durumu"></Column>
      </DataTable>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: "PeerOperations",
  data() {
    return {
      peers: [
        {peerName: "peer1", port: 7058, host: "0.0.0.0"},
        {peerName: "peer2", port: 7058, host: "0.0.0.0"},
        {peerName: "peer3", port: 7058, host: "0.0.0.0"}
      ],
      channels: [
        {channelName: "channel-1"},
        {channelName: "channel-2"},
        {channelName: "channel-3"},
      ],
      chaincodes: [
        {ccName: "gvta", version: "0.0.1", sequence: 1, state: "instaleld"},
        {ccName: "gvta", version: "0.0.1", sequence: 1, state: "instaleld"},
        {ccName: "gvta", version: "0.0.1", sequence: 1, state: "instaleld"}
      ],
      selectedPeer: null,
      selectedCC: null
    }
  }
}
</script>

<style scoped>
.border {
  border: 1px solid #ced4da;
  /*border-radius: 3px;*/
}
</style>