const BaseNode = require(`./BaseNode`)
const fileManager = require(`./files`)
const childProcess = require(`child_process`)

module.exports = class PeerNode extends BaseNode {
    constructor(peerName, password, orgName, port, csrHosts) {
        super(orgName, peerName);
        this._port = port;
        this._password = password;
        this._csrHosts = csrHosts;
        this.folderPrep();
        this.ENV_FILE = [
            {
                name: `CORE_PEER_ID`,
                value: `${peerName}.${orgName}.com`
            },
            {
                name: `CORE_PEER_ADDRESS`,
                value: `${peerName}.${orgName}.com:${port}`
            },
            {
                name: `CORE_PEER_LOCALMSPID`,
                value: `${orgName}`
            },
            {
                name: `CORE_PEER_LISTENADDRESS`,
                value: `0.0.0.0:${port}`
            },
            {
                name: `CORE_PEER_CHAINCODELISTENADDRESS`,
                value: `0.0.0.0:${port + 1}`
            },
            {
                name: `CORE_PEER_MSPCONFIGPATH`,
                value: `/tmp/hyperledger/${orgName}/${peerName}/msp`
            },
            {
                name: `CORE_VM_ENDPOINT`,
                value: `unix:///host/var/run/docker.sock`
            },
            {
                name: `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE`,
                value: `${this.getNetwork}`
            },
            {
                name: `FABRIC_LOGGING_SPEC`,
                value: `info`
            },
            {
                name: `CORE_PEER_TLS_ENABLED`,
                value: `true`
            },
            {
                name: `CORE_PEER_TLS_CERT_FILE`,
                value: `/tmp/hyperledger/${orgName}/${peerName}/tls/${orgName}-${peerName}-tls-cert.pem`
            },
            {
                name: `CORE_PEER_TLS_KEY_FILE`,
                value: `/tmp/hyperledger/${orgName}/${peerName}/tls/${orgName}-${peerName}-tls-key.pem`
            },
            {
                name: `CORE_PEER_TLS_ROOTCERT_FILE`,
                value: `/tmp/hyperledger/${orgName}/${peerName}/tls/tls-ca-cert.pem`
            },
            {
                name: `CORE_PEER_GOSSIP_USELEADERELECTION`,
                value: `false`
            },
            {
                name: `CORE_PEER_GOSSIP_ORGLEADER`,
                value: `true`
            },
            {
                name: `CORE_PEER_GOSSIP_BOOTSTRAP`,
                value: `${peerName}.${orgName}.com:${port}`
            },
            {
                name: `CORE_PEER_GOSSIP_EXTERNALENDPOINT`,
                value: `${peerName}.${orgName}.com:${port}`
            },
            {
                name: `CORE_LEDGER_STATE_STATEDATABASE`,
                value: `CouchDB`
            },
            {
                name: `CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS`,
                value: `${peerName}.${orgName}.com.couchdb:5984`
            },
            {
                name: `CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME`,
                value: `dbadmin`
            },
            {
                name: `CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD`,
                value: `dbadminpw`
            }
        ]
    }

    get volume() {
        let volumes = [`/var/run:/host/var/run`,
            `${this.BASE_PATH}/peers/${this._userName}:/tmp/hyperledger/${this._orgName}/${this._userName}`]
        return super.getVolume(volumes);
    }

    get containerName() {
        return `${this._userName}.${this._orgName}.com`
    }

    get hostPort() {
        return `${this._port}-${this._port + 1}`
    }

    get userName() {
        return this._userName;
    }

    get type() {
        return "peer";
    }

    get password() {
        return this._password;
    }

    get csrHosts() {
        return this._csrHosts;
    }

    get imageName() {
        return this.IMAGES.FABRIC_PEER;
    }

    get serverStartCmd() {
        return ``
    }

    generateEnvFile() {
        return super.generateEnvFile(this.ENV_FILE);
    }

    generateCouchDBCmd() {
        // `docker run -d --name ${this.userName}.${this._orgName} `
        let cmdComponents = [`docker run -d`,
            `--name ${this.userName}.${this._orgName}.com.couchdb`,
            `--net ${this.network}`,
            `-v ${this.BASE_PATH}/peers/${this._userName}/couchdb:/opt/couchdb/data`,
            `-e COUCHDB_USER=dbadmin -e COUCHDB_PASSWORD=dbadminpw`,
            `hyperledger/fabric-couchdb`,
            `&& sleep 3`];
        return cmdComponents.join(" ");
    }

    folderPrep() {
        let paths = [`${this.BASE_PATH}/peers/${this.userName}/msp`,
            `${this.BASE_PATH}/peers/${this.userName}/tls`]
        fileManager.mkdir(paths);
        fileManager.copyFile(`/home/anil/fabric-installation-app/Common/configuration/config.yaml`,
            `${this.BASE_PATH}/peers/${this.userName}/msp/config.yaml`);
    }

    arrangeFolderStructure(caNode) {
        let baseKeyPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.userName}/msp/keystore`;
        childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)

        let mspPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.userName}/msp`;

        if (caNode.isTls) {
            childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${this.BASE_PATH}/peers/${this.userName}/tls/${this._orgName}-${this.userName}-tls-cert.pem`)
            childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${this.BASE_PATH}/peers/${this.userName}/tls/${this._orgName}-${this.userName}-tls-key.pem`)
            childProcess.execSync(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem ${this.BASE_PATH}/peers/${this.userName}/tls/tls-ca-cert.pem`)
        } else {
            childProcess.execSync(`cp -r ${mspPath}/* ${this.BASE_PATH}/peers/${this.userName}/msp/`)
        }
    }
}