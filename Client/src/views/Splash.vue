<template>
  <div class="splash-container">
    <div class="p-grid p-jc-center p-align-center vertical-container">
      <div class="p-col p-text-center" style="margin-left: 15em; margin-right: 15em">
        <div class="p-card" style="padding-bottom: 15em; padding-top: 15em">
          <h1>Türk Ticaret Zinciri</h1>
          <h5>Ağ Kurulum Uygulaması</h5>
          <div class="p-col-12" style="position: relative">
            <InputText v-model.trim="orgName" type="text" placeholder="Kurum Adı"
                       class="p-col-4 p-text-center" :disabled="isOrgUp"
                       @input="v$.orgName.$touch()" :class="{ 'p-invalid': v$.orgName.$error}"></InputText>
            <div class="p-m-1 to-one-third p-invalid p-text-left" v-if="v$.orgName.$error"
                 style="color: red; font-size: 0.75em; ">
              * Kurum adı girilmesi zorunludur
            </div>
          </div>
          <div class="p-col-12 p-mt-1" style="position: relative">
            <InputText v-model.trim="internalIp" type="text" placeholder="İç IP"
                       class="p-col-2 p-text-center p-mr-1" :disabled="isOrgUp"
                       @input="v$.internalIp.$touch()" :class="{ 'p-invalid': v$.internalIp.$error}"></InputText>
            <InputText v-model.trim="externalIp" type="text" placeholder="Dış IP"
                       class="p-col-2 p-text-center " :disabled="isOrgUp"
                       @input="v$.externalIp.$touch()" :class="{ 'p-invalid': v$.externalIp.$error}"
                       style="position: relative">
            </InputText>
            <div class="p-m-1 to-one-third">
              <p class="p-invalid p-text-left" v-if="showErrorDiv()"
                 style="color: red; font-size: 0.75em; ">
                * Geçerli bir IP adresi girilmesi zorunludur
              </p>
            </div>
          </div>
          <div class="p-col-12 p-mt-2">
            <Button :label="btnText" class="p-col p-col-4" @click="onOrganizationBtnClick"
                    :disabled="v$.$invalid"></Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SplashService from "../service/SplashService";
import EventService from "../service/EventService";
import {required} from '@vuelidate/validators'
import {INIT_ITEMS, EVENTS, validateSingleIp} from "@/utilities/Utils";
import useVuelidate from "@vuelidate/core";

const SUMMARY = 'Açılış Ekranı';

export default {
  name: "Splash",
  setup() {
    return {v$: useVuelidate()};
  },
  data() {
    return {
      orgName: ``,
      externalIp: ``,
      internalIp: ``,
      btnText: ``,
      isOrgUp: false,
      eventService: null
    }
  },
  validations() {
    return {
      orgName: {required},
      externalIp: {required, validateSingleIp},
      internalIp: {required, validateSingleIp}
    }
  },
  methods: {
    onOrganizationBtnClick() {
      if (!this.orgName.trim()) alert(`Plesae enter org name`);
      else {
        localStorage.setItem(INIT_ITEMS.ORG_NAME, this.orgName);
        localStorage.setItem(INIT_ITEMS.INTERNAL_IP, this.internalIp);
        localStorage.setItem(INIT_ITEMS.EXTERNAL_IP, this.externalIp);
        this.$emit(EVENTS.NAVIGATE_TO_APP);
      }
    },
    init(res) {
      if (res.orgName) {
        this.orgName = res.orgName;
        this.isOrgUp = true;
      }
      if (res.externalIp) {
        this.externalIp = res.externalIp;
      }
      if (res.internalIp) {
        this.internalIp = res.internalIp;
      }
      this.setBtnText();
      this.setLocalStorage(res);
    },
    showErrorDiv() {
      return this.v$.externalIp.$error | this.v$.internalIp.$error;
    },
    setBtnText() {
      this.isOrgUp ? this.btnText = `Sonraki Adim` : this.btnText = `Organizasyon Olustur`;
    },
    setLocalStorage(res) {
      if (res.orgName) localStorage.setItem(INIT_ITEMS.ORG_CA, res.orgName);
      else this.clearStorageKey(INIT_ITEMS.ORG_CA);
      if (res.externalIp) localStorage.setItem(INIT_ITEMS.EXTERNAL_IP, res.externalIp);
      else this.clearStorageKey(INIT_ITEMS.EXTERNAL_IP);
      if (res.internalIp) localStorage.setItem(INIT_ITEMS.INTERNAL_IP, res.internalIp);
      else this.clearStorageKey(INIT_ITEMS.INTERNAL_IP);
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

  .to-one-third {
    position: absolute;
    left: 33%;
  }
}
</style>