const axiosRef = require("axios");
const axios = axiosRef.create({
    baseURL: "http://localhost/v1.40",
    socketPath: "/var/run/docker.sock"
})

class DockerApi {
    createContainer(configParams) {
        return axios.post(`/containers/create`, configParams)
    }

    startContainer(params) {
        return axios.post(`/containers/${params.Id}/start`);
    }
}

module.exports.DockerApi = DockerApi;