const BaseNode = require(`./BaseNode`)
const childProcess = require("child_process");

module.exports = class CertificateAuthority extends BaseNode {

    constructor(userName, password, port, orgName, isTls) {
        super(orgName, userName);
        this._password = password;
        this._port = port;
        this._mspDir = `${isTls ? `tls-ca` : `org-ca`}/${userName}/msp`;
        this._isTls = isTls;
        this._host = `0.0.0.0`;
        this._url = `https://` + this._userName +
            `:` + this._password +
            `@` + this._host +
            `:` + this._port;
        this._csrHosts = `\'0.0.0.0,*.${this._orgName}.com\'`;
        this._type = `admin`

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

    arrangeFolderStructure(caNode) {
        let baseKeyPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.userName}/msp/keystore`;
        childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)

        if (!this.isTls) {
            let mspPath = `${this.BASE_PATH}/fabric-ca/client/tls-ca/${this.userName}/msp`;
            childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${this.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
            childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${this.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
        }
    }

    get serverStartCmd() {
        return `fabric-ca-server start -d -b ${this._userName}:${this._password}`
    }

    get volume() {
        return `${this.BASE_PATH}/fabric-ca/server/${this._isTls ? `tls-ca` : `org-ca`}:/tmp/hyperledger/fabric-ca`
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
        return this._userName;
    }

    get password() {
        return this._password;
    }

    get port() {
        return `${this._port}:7052`;
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
        return this._csrHosts;
    }

    get type() {
        return this._type;
    }
    
    get host() {
        return this._host;
    }
    
}

