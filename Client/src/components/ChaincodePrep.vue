<template>
  <ChaincodeConfigDialog :visible="showConfigDialog" @close-dialog="showConfigDialog=false"/>
  <ChaincodeNewEndorserDialog :visible="showDialog" @close-dialog="showDialog=false"/>
  <div class="p-grid ">
    <div class="p-col-6 padding-left-zero">
      <h6 class="p-text-left p-mt-2">Düğümler</h6>
      <div class="p-inputgroup padding-left-zero">
        <Dropdown class="p-mr-2" optionLabel="label" placeholder="Düğüm Seçin"/>
      </div>
    </div>

    <div class="p-col-6 padding-zero p-mt-2 ">
      <h6 class="p-text-left p-ml-2">Orderer Bilgleri</h6>
      <div class="p-col padding-zero p-inputgroup p-ml-2">
        <div class="p-col padding-left-zero p-inputgroup">
          <InputText placeholder="Orderer Adresi"/>
        </div>
        <div class="p-col padding-left-zero p-inputgroup">
          <InputText placeholder="Orderder Org Adı"/>
        </div>
      </div>
    </div>

    <div class="p-col-6 p-grid p-mt-2" >
      <h6 class="p-text-left">Chaincode Bilgileri</h6>
      <DataTable :value="parameters" class="border">
        <Column field="type" header="Hello"></Column>
        <Column field="value" header="Hello 2"></Column>
      </DataTable>
      <div class="p-col-9"></div>
      <div class="p-col-3 padding-zero ">
        <Button class="p-col-12 p-mt-4"></Button>
      </div>
    </div>

    <div class="p-col-6 p-grid p-mt-2 p-ml-3" v-if="showEndorserTable">
      <h6 class="p-text-left">Chaincode Bilgileri</h6>
      <DataTable :value="parameters" class="border">
        <Column field="type" header="Hello"></Column>
        <Column field="value" header="Hello"></Column>
      </DataTable>
      <div class="p-col-9"></div>
      <div class="p-col-3 padding-zero ">
        <Button class="p-col-12 p-mt-4"></Button>
      </div>
    </div>

    <div class="p-col-9"></div>

    <div class="p-col-3 p-pt-4">
      <Button class="p-col-12" @click="onBackBtnClick"></Button>
    </div>

  </div>
</template>

<script>
import ChaincodeConfigDialog from "@/components/ChaincodeConfigDialog";
import ChaincodeNewEndorserDialog from "@/components/ChaincodeNewEndorserDialog";

export default {
  name: "ChaincodePrep",
  components: {
    'ChaincodeConfigDialog': ChaincodeConfigDialog,
    'ChaincodeNewEndorserDialog': ChaincodeNewEndorserDialog
  },
  data() {
    return {
      showDialog: false,
      displayBasic: false,
      parameters: [
        {type: 'Channel', value: '-'},
        {type: 'Chaincode', value: '-'},
        {type: 'Version', value: '-'},
        {type: 'Sekans No', value: '-'},
        {type: 'Paket', value: '-'},
      ]
    }
  },
  methods: {
    onBackBtnClick() {
      this.showConfigDialog = true;
      console.log(this.showConfigDialog);
    }
  },
  props: {
    showEndorserTable: {
      type: Boolean,
      default: false
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
  /*display: none !important;*/
  border: solid #ced4da;;
  border-width: 0 1px 0 0;
  border-radius: 3px;
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