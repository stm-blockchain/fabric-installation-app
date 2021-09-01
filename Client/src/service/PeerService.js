import Api from "@/service/Api";

export default {
    getPeers() {
        return Api().get('/peers').then(res => res.data);
    },
    createPeer(data) {
        return Api().post('/initPeer', data).then(res => res.data);
    },
    queryChannel(data) {
        return Api().post('/channels', data).then(res => res.data);
    },
    joinChannel(data) {
        return Api().post('/joinChannel', data).then(res => res.data);
    },
    prepareCommit(data) {
        return Api().post(`/prepareCommit`, data).then(res => res.data);
    }
}