<template>
  <div class="flexgrid-demo">
    <div class="p-grid p-jc-center p-align-center vertical-container">
      <div class="p-col p-text-center" style="margin-left: 15em; margin-right: 15em">
        <div class="p-card" style="padding-bottom: 15em; padding-top: 15em">
          <h1>Türk Tedarik Zinciri</h1>
          <h5>Ağ Kurulum Uygulaması</h5>
          <div class="p-col-12">
            <InputText type="text" placeholder="Organizasyon Adı" class="p-col-3 p-text-center"></InputText>
          </div>

          <div class="p-col-12">
            <Button label="Organizasyon Oluştur" class="p-col p-col-3" @click="onOrganizationBtnClick"></Button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Splash",
  methods: {
    onOrganizationBtnClick() {
      this.$emit('show-app');
    }
  }
}
</script>

<style scoped lang="scss">

.flexgrid-demo {
  .box {
    background-color: #ffffff;
    text-align: center;
    padding-top: 1rem;
    padding-bottom: 1rem;
    border-radius: 4px;
    box-shadow: 0 2px 1px -1px rgba(0, 0, 0, .2), 0 1px 1px 0 rgba(0, 0, 0, .14), 0 1px 3px 0 rgba(0, 0, 0, .12);
  }

  .box-stretched {
    height: 100%;
  }

  .vertical-container {
    margin: 0;
    height: 100vh;
    border-radius: 4px;
  }

  .nested-grid .p-col-4 {
    padding-bottom: 1rem;
  }

  .dynamic-box-enter-active, .dynamic-box-leave-active {
    transition: all .5s;
  }

  .dynamic-box-enter-from, .dynamic-box-leave-to {
    opacity: 0;
  }

  .dynamic-box-enter-from, .dynamic-box-leave-to {
    transform: translateX(30px);
  }

  p {
    margin: 0;
  }
}
</style>