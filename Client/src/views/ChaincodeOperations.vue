<template>
  <div class="p-grid">
    <div class="p-col p-text-center">
      <div class="p-card p-pb-2">
        <TabView class="p-col-12">
          <TabPanel header="Hazırla">
            <ChaincodePrep :show-endorser-table="false" @show-progress-bar="showProgress" @show-toast="showToast"/>
          </TabPanel>
          <TabPanel  header="Sun">
            <ChaincodePrep :show-endorser-table="true" @show-progress-bar="showProgress" @show-toast="showToast"/>
          </TabPanel>
        </TabView>
      </div>
    </div>
  </div>
</template>

<script>
import ChaincodePrep from "@/components/ChaincodePrep";
import {EVENTS} from "@/utilities/Utils";

export default {
  name: "ChaincodeOperations",
  methods: {
    showProgress(show) {
      this.$emit(EVENTS.SHOW_PROGRESS_BAR, show);
    },
    showToast(config) {
      this.$emit(EVENTS.SHOW_TOAST, config);
    }
  },
  components:{
    'ChaincodePrep': ChaincodePrep
  }
}
</script>

<style scoped>

</style>