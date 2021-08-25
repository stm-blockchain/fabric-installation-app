import Api from "@/service/Api";

export default {
    getPeers() {
        return Api().get('/peers').then(res => res.data);
    },
    createPeer(data) {
        return Api().post('/initPeer', data);
    },
    queryChannel(data) {
        return Api().get('/channels', data).then(res => res.data);
    },
    joinChannel(data) {
        return Api().post('/joinChannel', data);
    }
}