const BaseNode = require(`./BaseNode`);
const CaNode = require(`./CaNode`);
const fileManager = require(`./files`);
const childProcess = require(`child_process`);
const Errors = require(`./error`);

module.exports = class OrdererNode extends BaseNode {
    constructor(userName, password, orgName, port, csrHosts,
                adminName, adminPw) {
        super(userName, password, orgName, csrHosts, port, 3);
        this._password = password;
        this._csrHosts = csrHosts;
        this._adminName = adminName;
        this._adminPw = adminPw;
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
        this._logger.log({level: `debug`, message: `OrdererNode preparing folders`});
        try {
            let paths = [`${this.BASE_PATH}/orderers/${this.name}/msp`,
                `${this.BASE_PATH}/orderers/${this.name}/tls`,
                `${this.BASE_PATH}/orderers/${this.name}/ledgers`,
                `${this.BASE_PATH}/orderers/${this.name}/logs`,
                `${this.BASE_PATH}/orderers/${this.name}/adminclient`]
            fileManager.mkdir(paths);
            fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/config.yaml`,
                `${this.BASE_PATH}/orderers/${this.name}/msp/config.yaml`);
            fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/orderer.yaml`,
                `${this.BASE_PATH}/orderers/orderer.yaml`);
            this._logger.log({level: `debug`, message: `OrdererNode folder prep successful`});
        } catch (e) {
            throw new Errors.FolderStructureError(`ORDERER FOLDER PREP ERROR`, e);
        }
    }

    arrangeFolderStructure(caNode) {
        try {
            this._logger.log({level: `debug`, message: `OrdererNode arrange fodler structure`});
            let baseKeyPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.name}/msp/keystore`;
            childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)

            let mspPath = `${this.BASE_PATH}/fabric-ca/client/${caNode.isTls ? `tls-ca` : `org-ca`}/${this.name}/msp`;

            if (caNode.isTls) {
                this._logger.log({level: `debug`, message: `Arranging fodlers for a TLS node`});
                childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${this.BASE_PATH}/orderers/${this.name}/tls/cert.pem`)
                childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${this.BASE_PATH}/orderers/${this.name}/tls/key.pem`)
                childProcess.execSync(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem ${this.BASE_PATH}/orderers/${this.name}/tls/tls-ca-cert.pem`)
                childProcess.exec(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca/${this._adminName}/msp/keystore/*_sk ${this.BASE_PATH}/orderers/${this.name}/adminclient/client-tls-key.pem`)
                childProcess.exec(`cp ${this.BASE_PATH}/fabric-ca/client/tls-ca/${this._adminName}/msp/signcerts/cert.pem ${this.BASE_PATH}/orderers/${this.name}/adminclient/client-tls-cert.pem`)
            } else {
                this._logger.log({level: `debug`, message: `Arranging fodlers for a Org CA node`});
                childProcess.execSync(`cp -r ${mspPath}/* ${this.BASE_PATH}/orderers/${this.name}/msp/`)
            }
        } catch (e) {
            throw new Errors.FolderStructureError(`ORDERER ARRANGE STRUCTURE ERROR`, e);
        }
    }

    generateDockerConfiguration() {
        const port = `${this.port}/tcp`;
        const adminPort = `${this.port + 1}/tcp`;
        return {
            Name: this.containerName,
            Image: this.IMAGES.FABRIC_ORDERER,
            Env: super.createEnvForDockerConf(this.ENV_FILE),
            ExposedPorts: {
                [port]: {},
                [adminPort]: {}
            },
            HostConfig: {
                Binds: [`${this.BASE_PATH}/orderers:/tmp/hyperledger/${this.orgName}/orderers`],
                PortBindings: {
                    [port]: [{HostPort: `${port}`}],
                    [adminPort]: [{HostPort: `${adminPort}`}]
                }
            }
        };
    }

    generateAdminRegisterCommand(caNode) {
        if (!(caNode instanceof CaNode)) {
            throw Errors.NodeTypeError(`ERROR \'caNode\' NOT AN INSTANCE OF CaNode`, new Error());
        }

        try {
            let commandList = [`fabric-ca-client register -d`,
                `--id.name ${this._adminName}`,
                `--id.secret ${this._adminPw}`,
                `--id.type client`,
                `-u https://${caNode.host}:${caNode.port}`,
                `-M ${caNode.mspDir}`,
            `2>&1`];

            return commandList.join(` `);
        } catch (e) {
            throw new Errors.CommandGenerationError(`ORDERER ADMIN REGISTER CMD ERROR`, e);
        }
    }

    generateAdminEnrollCommand(caNode) {
        if (!(caNode instanceof CaNode)) {
            throw Errors.NodeTypeError(`ERROR \'caNode\' NOT AN INSTANCE OF CaNode`, new Error());
        }

        try {
            let commandList = [`fabric-ca-client enroll`,
                `-u https://${this._adminName}:${this._adminPw}@${caNode.host}:${caNode.port}`,
                `-M tls-ca/${this._adminName}/msp`,
                `--csr.hosts ${this.csrHosts}`,
                `--enrollment.profile tls`,
                `2>&1`];

            return commandList.join(` `);
        } catch (e) {
            throw new Errors.CommandGenerationError(`ORDERER ADMIN ENROLL CMD ERROR`, e);
        }
    }

    get containerName() {
        return `${this.name}.${this.orgName}.com`;
    }

    get nodeType() {
        return `orderer`
    }

    get password() {
        return this._password;
    }

    get adminName() {
        return this._adminName;
    }

    get adminPw() {
        return this._adminPw;
    }

}