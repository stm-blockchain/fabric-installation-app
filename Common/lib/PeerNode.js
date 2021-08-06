const BaseNode = require(`./BaseNode`);
const fileManager = require(`./files`);
const childProcess = require(`child_process`);
const Errors = require(`./error`);

module.exports = class PeerNode extends BaseNode {
    constructor(peerName, password, orgName, port, csrHosts) {
        super(peerName, password, orgName, csrHosts, port, 2);
        this._port = port;
        this._csrHosts = csrHosts;
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
        return `${this.name}.${this.orgName}.com`
    }

    get nodeType() {
        return `peer`;
    }

    generateDockerConfiguration() {
        const port = `${this._port}/tcp`;
        const ccPort = `${this._port + 1}/tcp`;
        return {
            Name: this.containerName,
            Image: this.IMAGES.FABRIC_PEER,
            Env: super.createEnvForDockerConf(this.ENV_FILE),
            ExposedPorts: {
                [port]: {},
                [ccPort]: {},
            },
            HostConfig: {
                Binds: [`/var/run:/host/var/run`,
                    `${this.BASE_PATH}/peers/${this.name}:/tmp/hyperledger/${this.orgName}/${this.name}`],
                PortBindings: {
                    [port]: [{HostPort: `${port}`}],
                    [ccPort]: [{HostPort: `${ccPort}`}]
                }
            }
        };
    }

    generateCouchDBConfig() {
        return {
            Name: `${this.name}.${this.orgName}.com.couchdb`,
            Image: this.IMAGES.FABRIC_COUCHDB,
            Env: ["COUCHDB_USER=dbadmin", "COUCHDB_PASSWORD=dbadminpw"],
            HostConfig: {
                Binds: [`${this.BASE_PATH}/peers/${this.name}/couchdb:/opt/couchdb/data`],
            }
        };
    }

    folderPrep() {
        try {
            this._logger.log({level: `debug`, message: `PeerNode preparing folders`});
            let paths = [`${this.BASE_PATH}/peers/${this.name}/msp`,
                `${this.BASE_PATH}/peers/${this.name}/tls`]
            fileManager.mkdir(paths);
            fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/config.yaml`,
                `${this.BASE_PATH}/peers/${this.name}/msp/config.yaml`);
            this._logger.log({level: `debug`, message: `PeerNode preparing folders successful`});
        } catch (e) {
            throw new Errors.FolderStructureError(`PEER FODLER PREP EERROR`, e);
        }
    }

    arrangeFolderStructure(caNode) {
        try {
            this._logger.log({level: `debug`, message: `PeerNode arranging folder structure`});
            let baseKeyPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.name}/msp/keystore`;
            childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)

            let mspPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.name}/msp`;

            if (caNode.isTls) {
                this._logger.log({level: `debug`, message: `Arranging fodlers for a TLS node`});
                childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${this.BASE_PATH}/peers/${this.name}/tls/${this.orgName}-${this.name}-tls-cert.pem`)
                childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${this.BASE_PATH}/peers/${this.name}/tls/${this.orgName}-${this.name}-tls-key.pem`)
                childProcess.execSync(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem ${this.BASE_PATH}/peers/${this.name}/tls/tls-ca-cert.pem`)
            } else {
                this._logger.log({level: `debug`, message: `Arranging fodlers for an Org CA node`});
                childProcess.execSync(`cp -r ${mspPath}/* ${this.BASE_PATH}/peers/${this.name}/msp/`)
            }
        } catch (e) {
            throw new Errors.FolderStructureError(`PEER ARRANGE STRUCTURE ERROR`, e);
        }
    }
}