const BaseNode = require(`./BaseNode`)
const childProcess = require("child_process");
const Errors = require(`./error`);

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
            `:` + this.port;
        this._csrHosts = csrHosts;
        this._nodeType = `admin`

        this._ENV_FILES = [
            {
                name: `FABRIC_CA_SERVER_HOME`,
                value: `/tmp/hyperledger/fabric-ca/crypto`
            },
            {
                name: `FABRIC_CA_SERVER_PORT`,
                value: `${this.port}`
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
        const port = `${this.port}/tcp`;
        return {
            Name: `${this._isTls ? "tls-ca" : "org-ca"}.${this.orgName}.com`,
            Image: this.IMAGES.FABRIC_CA,
            Env: this.createEnvForDockerConf(),
            Cmd: [`sh`, `-c`, `fabric-ca-server start -d -b ${this.name}:${this._password}`],
            ExposedPorts: {
                [port]: {}
            },
            HostConfig: {
                Binds: [`${this.BASE_PATH}/fabric-ca/server/${this._isTls ? `tls-ca` : `org-ca`}:/tmp/hyperledger/fabric-ca`],
                PortBindings: {
                    [port]: [{HostPort: `${this.port}`}]
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
        try {
            let baseKeyPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.name}/msp/keystore`;
            childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)

            if (!this.isTls) {
                let mspPath = `${this.BASE_PATH}/fabric-ca/client/tls-ca/${this.name}/msp`;
                childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${this.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
                childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${this.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
            }
        } catch (e) {
            throw new Errors.FolderStructureError(`CA FOLDER STRUCTURE ERROR`, e);
        }
    }

    generateOrgAdminRegisterCommand() {
        if (this.isTls) throw new Errors.NodeTypeError(`ERROR TLS CA CANNOT REGISTER AN ORG ADMIN`, new Error());

        try {
            let commandParams = [`fabric-ca-client register -d`,
                `--id.name ${this._adminName}`,
                `--id.secret ${this._adminSecret}`,
                `--id.type admin`,
                `-u https://${this.host}:${this.port}`,
                `-M ${this.mspDir}`,
                `2>&1`];

            return commandParams.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`CA ORG-ADMIN REGISTER CMD ERROR`, e);
        }
    }

    generateOrgAdminEnrollCommand() {
        if (this.isTls) throw Error("This method can only be called by a org-ca node");

        try {
            process.env.FABRIC_CA_CLIENT_HOME = `${this.BASE_PATH}/fabric-ca/client`;
            process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${this.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
            let commandParams = [`fabric-ca-client enroll`,
                `-u https://${this._adminName}:${this._adminSecret}@${this.host}:${this.port}`,
                `-M org-ca/${this._adminName}/msp`,
                `--csr.hosts ${this.csrHosts}`,
                `2>&1`]

            return commandParams.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`CA ORG-ADMIN ENROLL CMD ERROR`, e);
        }
    }

    get adminName() {
        return this._adminName;
    }

    get adminSecret() {
        return this._adminSecret;
    }

    get password() {
        return this._password;
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

    get nodeType() {
        return this._nodeType;
    }
}

