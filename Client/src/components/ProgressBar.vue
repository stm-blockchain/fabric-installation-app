<template>
  <Dialog :closable="false" :close-on-escape="false" :modal="true" v-model:visible="show" @hide="close" >
    <div class="p-grid p-m-2">
      <ProgressSpinner style="width:60px;height:60px" strokeWidth="4" animationDuration="1s"/>
      <h4 class="p-col p-d-inline p-ml-2">Yükleniyor...</h4>
    </div>
  </Dialog>
</template>

<script>
import {EVENTS} from "@/utilities/Utils";

export default {
  name: "ProgressBar",
  props: ['display'],
  methods: {
    close() {
      console.log('hide')
      this.$emit(EVENTS.SHOW_PROGRESS_BAR, false)
    }
  },
  data() {
    return {
      show: false
    }
  },
  watch: {
    display(show) {
      this.show = show;
    }
  }
}
</script>

<style scoped>

</style>

