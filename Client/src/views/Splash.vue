<template>
  <div class="splash-container">
    <div class="p-grid p-jc-center p-align-center vertical-container">
      <div class="p-col p-text-center" style="margin-left: 15em; margin-right: 15em">
        <div class="p-card" style="padding-bottom: 15em; padding-top: 15em">
          <h1>Türk Ticaret Zinciri</h1>
          <h5>Ağ Kurulum Uygulaması</h5>
          <div class="p-col-12">
            <InputText v-model="orgName" type="text" placeholder="Organizasyon Adı"
                       class="p-col-3 p-text-center" :disabled="isOrgUp"></InputText>
          </div>

          <div class="p-col-12">
            <Button :label="btnText" class="p-col p-col-3" @click="onOrganizationBtnClick"></Button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SplashService from "../service/SplashService";
import EventService from "../service/EventService";
import {INIT_ITEMS, EVENTS } from "@/utilities/Utils";

const SUMMARY = 'Açılış Ekranı';

export default {
  name: "Splash",
  data() {
    return {
      orgName: ``,
      btnText: ``,
      isOrgUp: false,
      eventService: null
    }
  },
  methods: {
    onOrganizationBtnClick() {
      if (!this.orgName.trim()) alert(`Plesae enter org name`);
      else {
        localStorage.setItem(`orgName`, this.orgName);
        this.$emit(EVENTS.NAVIGATE_TO_APP);
      }
    },
    init(res) {
      if (res.orgName) {
        this.orgName = res.orgName;
        this.isOrgUp = true;
      }
      this.setBtnText();
      this.setLocalStorage(res);
    },
    setBtnText() {
      this.isOrgUp ? this.btnText = `Sonraki Adim` : this.btnText = `Organizasyon Olustur`;
    },
    setLocalStorage(res) {
      if (res.orgName) localStorage.setItem(INIT_ITEMS.ORG_CA, res.orgName);
      else this.clearStorageKey(INIT_ITEMS.ORG_CA);
      if (res.tlsCa) localStorage.setItem(INIT_ITEMS.TLS_CA, JSON.stringify(res.tlsCa));
      else this.clearStorageKey(INIT_ITEMS.TLS_CA);
      if (res.orgCa) localStorage.setItem(INIT_ITEMS.ORG_CA, JSON.stringify(res.orgCa));
      else this.clearStorageKey(INIT_ITEMS.ORG_CA);
    },
    clearStorageKey(key) {
      localStorage.setItem(key, ``);
    }
  },
  async created() {
    this.eventService = new EventService(this, SUMMARY);
    try {
      this.eventService.showProgress(true);
      const res = await SplashService.getInitClient();
      this.init(res);
      this.eventService.showProgress(false);
    } catch (e) {
      this.eventService.fail(`Error: ${e.message}`);
    }
  }
}
</script>

<style scoped lang="scss">

.splash-container {
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