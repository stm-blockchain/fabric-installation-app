import Api from './Api';

export default {
    getInitClient() {
        return Api().get(`/initClient`).then(res => res.data);
    }
}
