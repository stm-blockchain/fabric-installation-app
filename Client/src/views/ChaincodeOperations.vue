<template>
  <div class="p-grid">
    <div class="p-col p-text-center">
      <div class="p-card p-grid p-pb-2">
        <TabView class="p-col-12">
          <TabPanel class="p-col" header="Hazırla">
            <ChaincodePrep/>
          </TabPanel>
          <TabPanel  header="Sun">
            Content II
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