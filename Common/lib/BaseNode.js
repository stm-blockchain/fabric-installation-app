const fileManager = require(`./files`)

module.exports = class BaseNode {

    constructor(orgName, userName) {
        this._orgName = orgName;
        this._userName = userName;
        this.network = `ttz_docker_network`;
        this.BASE_PATH = `${process.env.HOME}/ttz/${this._orgName}`
    }

    SHARED = {
        FABRIC_LOGGING_SPEC: {
            name: `FABRIC_LOGGING_SPEC`,
            value: `DEBUG`
        }
    }

    IMAGES = {
        FABRIC_CA: `hyperledger/fabric-ca:latest`,
        FABRIC_PEER: `hyperledger/fabric-peer:2.3`,
        FABRIC_ORDERER: `hyperledger/fabric-orderer:2.3`,
        FABRIC_TOOLS: `hyperledger/fabric-tools:2.3`,
        FABRIC_CCENV: `hyperledger/fabric-ccenv:2.3`,
        FABRIC_NODEENV: `hyperledger/fabric-nodeenv:2.3`,
        FABRIC_COUCHDB: `hyperledger/fabric-couchdb:latest`
    }

    generateEnvFile(envObj) {
        // This method will be overridden
        let fullPath = `${process.env.HOME}/ttz/envFiles/${this._userName}.env`;
        fileManager.createEnvFile(envObj, fullPath);
        return fullPath;
    }

    createEnvForDockerConf(envObj) {
        let envDocker = []
        envObj.forEach(element => {
            envDocker.push(`${element.name}=${element.value}`);
        });
        return envDocker;
    }

    generateDockerConfiguration() {
        // This method will be overridden
        /*
        * create env variable list
        * set HostConfig.Binds (for the volume)
        * connect the network to the container
        * set Image
        * set Cmd
        * set ExposedPorts
        * set HostConfig.PortBindings: {:[{}]}
        * */
    }

    arrangeFolderStructure(caNode) {
        // This method will be overridden
    }

    getVolume(volumes) {
        // To be overridden
        let volumeString = ``
        volumes.forEach(volume => {
            volumeString += `-v ${volume} `;
        })

        return volumeString;
    }

    get getNetwork() {
        return this.network;
    }
}