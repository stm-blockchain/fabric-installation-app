<template>
  <div class="p-grid p-jc-center p-align-top vertical-container">
    <div class="p-col p-text-center">
      <div class="p-card p-grid">
        <div class="p-col-12" style="text-align: left; ">
          <h5>TLS Sunucu Bilgilerini Girin</h5>
        </div>
        <div class="p-col-12 p-md-6">
          <div class="p-inputgroup">
							<span class="p-inputgroup-addon">
								<i class="pi pi-user"></i>
							</span>
            <InputText placeholder="Username"/>
          </div>
        </div>

        <div class="p-col-12 p-md-6">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon"><i class="pi pi-shopping-cart"></i></span>
            <span class="p-inputgroup-addon"><i class="pi pi-globe"></i></span>
            <InputText placeholder="Price"/>
            <span class="p-inputgroup-addon">$</span>
            <span class="p-inputgroup-addon">.00</span>
          </div>
        </div>

        <div class="p-col-12 p-md-6">
          <div class="p-inputgroup">
            <Button label="Search"/>
            <InputText placeholder="Keyword"/>
          </div>
        </div>

        <div class="p-col-12 p-md-6">
          <div class="p-inputgroup">
							<span class="p-inputgroup-addon p-inputgroup-addon-checkbox">
								<Checkbox v-model="inputGroupValue" :binary="true"/>
							</span>
            <InputText placeholder="Confirm"/>
          </div>
        </div>
        <div class="p-col-9">
        </div>
        <Button :label="btnText" class="p-col-3 p-align-end"></Button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      btnMsg: 'TLS Sunucusu Oluştur'
    }
  }
}
</script>

<style scoped>
.container {
  /*top: 50vh;*/
  /*position: fixed;*/
  /*box-sizing: border-box;*/
}
.vertical-container {
  margin: 0;
  height: 100vh;
  border-radius: 4px;
}
</style>
