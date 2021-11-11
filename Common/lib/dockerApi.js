const axiosRef = require("axios");
const url = require(`url`)

const axios = axiosRef.create({
    baseURL: "http://localhost/v1.40",
    socketPath: "/var/run/docker.sock"
})

module.exports = class DockerApi {

    listContainers() {
        let queryParams = { all: true}
        const params = new url.URLSearchParams(queryParams);
        return axios.get(`/containers/json?${params}`);
    }

    listImages() {
        return axios.get(`/images/json`);
    }

    createContainer(configParams) {
        let queryParams = { name: `${configParams.Name}`}
        const params = new url.URLSearchParams(queryParams);
        return axios.post(`/containers/create?${params}`, configParams);
    }

    startContainer(params) {
        return axios.post(`/containers/${params.Id}/start`);
    }

    removeContainer(name) {
        let queryParams = { force: true};
        const params = new url.URLSearchParams(queryParams);
        axios.delete(`/containers/${name}?${params}`);
    }

    checkNetwork(name) {
        return axios.get(`/networks/${name}`);
    }

    createNetwork(configParams) {
        return axios.post(`/networks/create`, configParams);
    }

    connectContainerToNetwork(networkId, configParams) {
        return axios.post(`/networks/${networkId}/connect`, configParams);
    }

    removeContainerFromNetwork(name) {
        let queryParams = { force: "true" }
        const params = new url.URLSearchParams(queryParams);
        return axios.delete(`/containers/${name}?${params}`);
    }

    inspectContainer(name) {
        return axios.get(`/containers/${name}/json`);
    }
}
