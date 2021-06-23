const BaseNode = require(`./BaseNode`)
const CaNode = require(`./CaNode`)
const fileManager = require(`./files`)
const childProcess = require(`child_process`)

module.exports = class OrdererNode extends BaseNode {
    constructor(userName, password, orgName, port, csrHosts,
                adminName, adminPw) {
        super(orgName, userName);
        this._port = port;
        this._password = password;
        this._csrHosts = csrHosts;
        this._adminName = adminName;
        this._adminPw = adminPw;
        this.folderPrep();
        this.ENV_FILE = [
            {
                name: "ORDERER_GENERAL_LISTENADDRESS",
                value: "0.0.0.0"
            },
            {
                name: "ORDERER_GENERAL_LISTENPORT",
                value: `${port}`
            },
            {
                name: "ORDERER_GENERAL_LOCALMSPID",
                value: `${orgName}`
            },
            {
                name: `ORDERER_GENERAL_LOCALMSPDIR`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/msp`
            },
            {
                name: `ORDERER_GENERAL_TLS_ENABLED`,
                value: `true`
            },
            {
                name: `ORDERER_GENERAL_TLS_CERTIFICATE`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/tls/cert.pem`
            },
            {
                name: `ORDERER_GENERAL_TLS_PRIVATEKEY`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/tls/key.pem`
            },
            {
                name: `ORDERER_GENERAL_BOOTSTRAPMETHOD`,
                value: `none`
            },
            {
                name: `ORDERER_GENERAL_LOGLEVEL`,
                value: `debug`
            },
            {
                name: `ORDERER_DEBUG_BROADCASTTRACEDIR`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/logs`
            },
            {
                name: `ORDERER_FILELEDGER_LOCATION`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/ledgers`
            },
            {
                name: `ORDERER_CHANNELPARTICIPATION_ENABLED`,
                value: `true`
            },
            {
                name: `ORDERER_ADMIN_LISTENADDRESS`,
                value: `0.0.0.0:${port + 1}`
            },
            {
                name: `ORDERER_ADMIN_TLS_ENABLED`,
                value: `true`
            },
            {
                name: `ORDERER_ADMIN_TLS_PRIVATEKEY`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/tls/key.pem`
            },
            {
                name: `ORDERER_ADMIN_TLS_CERTIFICATE`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/tls/cert.pem`
            },
            {
                name: `ORDERER_ADMIN_TLS_CLIENTAUTHREQUIRED`,
                value: `true`
            },
            {
                name: `ORDERER_ADMIN_TLS_CLIENTROOTCAS`,
                value: `/tmp/hyperledger/${orgName}/orderers/${userName}/tls/tls-ca-cert.pem`
            },
            {
                name: `FABRIC_CFG_PATH`,
                value: `/tmp/hyperledger/${orgName}/orderers`
            },
            {
                name: `FABRIC_LOGGING_SPEC`,
                value: `info`
            }
        ]
    }

    folderPrep() {
        let paths = [`${this.BASE_PATH}/orderers/${this.userName}/msp`,
            `${this.BASE_PATH}/orderers/${this.userName}/tls`,
            `${this.BASE_PATH}/orderers/${this.userName}/ledgers`,
            `${this.BASE_PATH}/orderers/${this.userName}/logs`,
            `${this.BASE_PATH}/orderers/${this.userName}/adminclient`]
        fileManager.mkdir(paths);
        fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/config.yaml`,
            `${this.BASE_PATH}/orderers/${this.userName}/msp/config.yaml`);
        fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/orderer.yaml`,
            `${this.BASE_PATH}/orderers/orderer.yaml`);
    }

    arrangeFolderStructure(caNode) {
        let baseKeyPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.userName}/msp/keystore`;
        childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)

        let mspPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.userName}/msp`;

        if (caNode.isTls) {
            childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${this.BASE_PATH}/orderers/${this.userName}/tls/cert.pem`)
            childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${this.BASE_PATH}/orderers/${this.userName}/tls/key.pem`)
            childProcess.execSync(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem ${this.BASE_PATH}/orderers/${this.userName}/tls/tls-ca-cert.pem`)
            childProcess.exec(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca/${this._adminName}/msp/keystore/*_sk ${this.BASE_PATH}/orderers/${this.userName}/adminclient/client-tls-key.pem`)
            childProcess.exec(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca/${this._adminName}/msp/signcerts/cert.pem ${this.BASE_PATH}/orderers/${this.userName}/adminclient/client-tls-cert.pem`)
        } else {
            childProcess.execSync(`cp -r ${mspPath}/* ${this.BASE_PATH}/orderers/${this.userName}/msp/`)
        }
    }

    generateDockerConfiguration() {
        const port = `${this._port}/tcp`;
        const adminPort = `${this._port + 1}/tcp`;
        return {
            Name: `${this._userName}.${this._orgName}.com`,
            Image: this.IMAGES.FABRIC_ORDERER,
            Env: super.createEnvForDockerConf(this.ENV_FILE),
            ExposedPorts: {
                [port]: {},
                [adminPort]: {}
            },
            HostConfig: {
                Binds: [`${this.BASE_PATH}/orderers:/tmp/hyperledger/${this._orgName}/orderers`],
                PortBindings: {
                    [port]: [{HostPort: `${port}`}],
                    [adminPort]: [{HostPort: `${adminPort}`}]
                }
            }
        };
    }

    generateAdminRegisterCommand(caNode) {
        if (!(caNode instanceof CaNode)) {
            throw Error("CaNode is not an instance")
        }

        let commandList = [`fabric-ca-client register -d`,
        `--id.name ${this._adminName}`,
        `--id.secret ${this._adminPw}`,
        `--id.type client`,
        `-u https://${caNode.host}:${caNode.hostPort}`,
        `-M ${caNode.mspDir}`];

        return commandList.join(` `);
    }

    generateAdminEnrollCommand(caNode) {
        if (!(caNode instanceof CaNode)) {
            throw Error("CaNode is not an instance")
        }

        let commandList = [`fabric-ca-client enroll`,
        `-u https://${this._adminName}:${this._adminPw}@${caNode.host}:${caNode.hostPort}`,
        `-M tls-ca/${this._adminName}/msp`,
        `--csr.hosts ${this.csrHosts}`,
        `--enrollment.profile tls`];

        return commandList.join(` `);
    }

    get volume(){
        let volumes = [`${this.BASE_PATH}/orderers:/tmp/hyperledger/${this._orgName}/orderers`];
        return super.getVolume(volumes);
    }

    get containerName() {
        return `${this._userName}.${this._orgName}.com`;
    }

    get hostPort() {
        return `${this._port}-${this._port + 1}`;
    }

    get userName() {
        return this._userName;
    }

    get type() {
        return `orderer`;
    }

    get password() {
        return this._password;
    }

    get csrHosts() {
        return `\"${this._csrHosts}\"`;
    }

    get imageName() {
        return this.IMAGES.FABRIC_ORDERER;
    }

    get serverStartCmd() {
        return ``
    }

    generateEnvFile() {
        return super.generateEnvFile(this.ENV_FILE);
    }
}