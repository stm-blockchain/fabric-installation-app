<template>
  <div class="p-grid">
    <div class="p-col p-text-center">
      <div class="p-card p-pb-2">
        <TabView class="p-col-12">
          <TabPanel header="Hazırla">
            <ChaincodePrep :show-endorser-table="false"/>
          </TabPanel>
          <TabPanel  header="Sun">
            <ChaincodePrep :show-endorser-table="true"/>
          </TabPanel>
        </TabView>
      </div>
    </div>
  </div>
</template>

<script>
import ChaincodePrep from "@/components/ChaincodePrep";

export default {
  name: "ChaincodeOperations",
  components:{
    'ChaincodePrep': ChaincodePrep
  }
}
</script>

<style scoped>

</style>