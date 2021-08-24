import Api from "@/service/Api";

export default {
   startUpCaServer(data) {
       return Api().post("/initCa", data);
   }
}