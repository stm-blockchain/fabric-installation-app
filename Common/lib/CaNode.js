const BaseNode = require(`./BaseNode`)
const childProcess = require("child_process");

module.exports = class CaNode extends BaseNode {

    constructor(userName, password, port, orgName, isTls, csrHosts, adminName, adminSecret) {
        super(userName, password, orgName, csrHosts, port, 1);
        this._password = password;
        this._mspDir = `${isTls ? `tls-ca` : `org-ca`}/${userName}/msp`;
        this._isTls = isTls;
        this._host = `0.0.0.0`;
        this._adminName = adminName;
        this._adminSecret = adminSecret;
        this._url = `https://` + userName +
            `:` + this._password +
            `@` + this._host +
            `:` + this._port;
        this._csrHosts = csrHosts;
        this._nodeType = `admin`

        this._ENV_FILES = [
            {
                name: `FABRIC_CA_SERVER_HOME`,
                value: `/tmp/hyperledger/fabric-ca/crypto`
            },
            {
                name: `FABRIC_CA_SERVER_PORT`,
                value: `${this._port}`
            },
            {
                name: `FABRIC_CA_SERVER_TLS_ENABLED`,
                value: true
            },
            {
                name: `FABRIC_CA_SERVER_CA_NAME`,
                value: `${isTls ? `tls-ca` : `org-ca`}.${this.orgName}.com`
            },
            {
                name: `FABRIC_CA_SERVER_CSR_CN`,
                value: `${isTls ? `tls-ca` : `org-ca`}.${this.orgName}.com`
            },
            {
                name: `FABRIC_CA_SERVER_CSR_HOSTS`,
                value: `0.0.0.0`
            },
            {
                name: `FABRIC_CA_SERVER_DEBUG`,
                value: true
            }
        ]
    }

    generateEnvFile() {
        if (!this.isTls) {
            this._ENV_FILES.push({name: `FABRIC_CA_SERVER_TLS_CERTFILE`, value: `../tls/cert.pem`})
            this._ENV_FILES.push({name: `FABRIC_CA_SERVER_TLS_KEYFILE`, value: `../tls/key.pem`})
        }
        return super.generateEnvFile(this._ENV_FILES);
    }

    generateDockerConfiguration() {
        const port = `${this.hostPort}/tcp`;
        return {
            Name: `${this._isTls ? "tls-ca" : "org-ca"}.${this.orgName}.com`,
            Image: this.IMAGES.FABRIC_CA,
            Env: this.createEnvForDockerConf(),
            Cmd: [`sh`,`-c`,`fabric-ca-server start -d -b ${this._name}:${this._password}`],
            ExposedPorts: {
                [port]: {}
            },
            HostConfig: {
                Binds: [`${this.BASE_PATH}/fabric-ca/server/${this._isTls ? `tls-ca` : `org-ca`}:/tmp/hyperledger/fabric-ca`],
                PortBindings: {
                    [port]: [{HostPort: `${this.hostPort}`}]
                }
            }
        };
    }

    createEnvForDockerConf() {
        if (!this.isTls) {
            this._ENV_FILES.push({name: `FABRIC_CA_SERVER_TLS_CERTFILE`, value: `../tls/cert.pem`})
            this._ENV_FILES.push({name: `FABRIC_CA_SERVER_TLS_KEYFILE`, value: `../tls/key.pem`})
        }

        return super.createEnvForDockerConf(this._ENV_FILES);
    }

    arrangeFolderStructure(caNode) {
        let baseKeyPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.userName}/msp/keystore`;
        childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)

        if (!this.isTls) {
            let mspPath = `${this.BASE_PATH}/fabric-ca/client/tls-ca/${this.userName}/msp`;
            childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${this.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
            childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${this.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
        }
    }

    generateOrgAdminRegisterCommand() {
        if (this.isTls) throw Error("This method can only be called by a org-ca node");

        let commandParams = [`fabric-ca-client register -d`,
        `--id.name ${this._adminName}`,
        `--id.secret ${this._adminSecret}`,
        `--id.type admin`,
        `-u https://${this.host}:${this.hostPort}`,
        `-M ${this.mspDir}`];

        return commandParams.join(" ");
    }

    generateOrgAdminEnrollCommand() {
        if (this.isTls) throw Error("This method can only be called by a org-ca node");

        process.env.FABRIC_CA_CLIENT_HOME =`${this.BASE_PATH}/fabric-ca/client`;
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES =`${this.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
        let commandParams = [`fabric-ca-client enroll`,
        `-u https://${this._adminName}:${this._adminSecret}@${this.host}:${this.hostPort}`,
        `-M org-ca/${this._adminName}/msp`,
        `--csr.hosts ${this.csrHosts}`]

        return commandParams.join(" ");
    }

    // set adminName(name) {
    //     this._adminName = name;
    // }
    //
    // set adminSecret(secret) {
    //     this._adminSecret = secret;
    // }

    get adminName() {
        return this._adminName;
    }

    get serverStartCmd() {
        return `fabric-ca-server start -d -b ${this._userName}:${this._password}`
    }

    get volume() {
        let volumes = [`${this.BASE_PATH}/fabric-ca/server/${this._isTls ? `tls-ca` : `org-ca`}:/tmp/hyperledger/fabric-ca`]
        return super.getVolume(volumes);
    }

    get imageName() {
        return this.IMAGES.FABRIC_CA;
    }

    get containerName() {
        return `${this._isTls ? "tls-ca" : "org-ca"}.${this.orgName}.com`
    }

    get orgName() {
        return this._orgName;
    }

    get userName() {
        return this._name;
    }

    get password() {
        return this._password;
    }

    get port() {
        return this._port;
    }

    get hostPort() {
        return this._port;
    }

    get mspDir() {
        return this._mspDir;
    }

    get isTls() {
        return this._isTls;
    }

    get url() {
        return this._url;
    }

    get csrHosts() {
        return `\'${this._csrHosts}\'`;
    }

    get type() {
        return this._type;
    }

    get nodeType() {
        return this._nodeType;
    }
    
    get host() {
        return this._host;
    }
    
}

