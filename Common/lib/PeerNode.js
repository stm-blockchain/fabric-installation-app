const BaseNode = require(`./BaseNode`)
const fileManager = require(`./files`)
const childProcess = require(`child_process`)

module.exports = class PeerNode extends BaseNode {
    constructor(peerName, password, orgName, port, csrHosts) {
        super(peerName, password, orgName, csrHosts, port, 2);
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

    get containerName() {
        return `${this._name}.${this._orgName}.com`
    }

    get hostPort() {
        return `${this._port}-${this._port + 1}`
    }

    get userName() {
        return this._name;
    }

    get type() {
        return this._type;
    }

    get nodeType() {
        return `peer`;
    }

    get password() {
        return this._password;
    }

    get csrHosts() {
        return `\'${this._csrHosts}\'`;
    }

    get orgName() {
        return this._orgName;
    }

    get port() {
        return this._port;
    }

    generateDockerConfiguration() {
        const port = `${this._port}/tcp`;
        return {
            Name: this.containerName,
            Image: this.IMAGES.FABRIC_PEER,
            Env: super.createEnvForDockerConf(this.ENV_FILE),
            ExposedPorts: {
                [port]: {}
            },
            HostConfig: {
                Binds: [`/var/run:/host/var/run`,
                    `${this.BASE_PATH}/peers/${this._name}:/tmp/hyperledger/${this._orgName}/${this._name}`],
                PortBindings: {
                    [port]: [{HostPort: `${port}`}]
                }
            }
        };
    }

    generateCouchDBConfig() {
        return {
            Name: `${this.userName}.${this._orgName}.com.couchdb`,
            Image: this.IMAGES.FABRIC_COUCHDB,
            Env: ["COUCHDB_USER=dbadmin", "COUCHDB_PASSWORD=dbadminpw"],
            HostConfig: {
                Binds: [`${this.BASE_PATH}/peers/${this._name}/couchdb:/opt/couchdb/data`],
            }
        };
    }

    folderPrep() {
        let paths = [`${this.BASE_PATH}/peers/${this.userName}/msp`,
            `${this.BASE_PATH}/peers/${this.userName}/tls`]
        fileManager.mkdir(paths);
        fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/config.yaml`,
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