const axiosRef = require("axios");
const url = require(`url`)

const axios = axiosRef.create({
    baseURL: "http://localhost/v1.40",
    socketPath: "/var/run/docker.sock"
})

module.exports = class DockerApi {
    createContainer(configParams) {
        let queryParams = { name: `${configParams.Name}`}
        const params = new url.URLSearchParams(queryParams);
        return axios.post(`/containers/create?${params}`, configParams);
    }

    startContainer(params) {
        return axios.post(`/containers/${params.Id}/start`);
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
}
