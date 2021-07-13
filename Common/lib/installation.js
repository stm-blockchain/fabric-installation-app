const childProcess = require("child_process");
const util = require("util");
const exec = util.promisify(childProcess.exec);
const CaNode = require(`./CaNode`);
const BaseNode = require(`./BaseNode`);
const PeerNode = require(`./PeerNode`);
const fileManager = require("./files");
const DockerApi = require(`./dockerApi`);

const Commands = {
    OS: {
      TO_STDOUT: "2>&1"
    },
    FABRIC_CA: {
        FABRIC_CA_CLIENT: "fabric-ca-client",
        ENROLL: "enroll",
        REGISTER: "register"
    },
    PEER: {
        FETCH: "peer channel fetch",
        JOIN: "peer channel join",
        FETCH_OLDEST: "oldest",
        INSTALL: "peer lifecycle chaincode install",
        QUERY_INSTALLED: "peer lifecycle chaincode queryinstalled -O json",
        APPROVE: "peer lifecycle chaincode approveformyorg",
        CHECK_COMMIT_READINESS: "peer lifecycle chaincode checkcommitreadiness",
        COMMIT: "peer lifecycle chaincode commit"
    }
}

let dockerNetworkExists = false;

module.exports = class Installation {
    constructor() {
        this.dockerService = new DockerApi();
        this.dockerNetworkName = "ttz_docker_network"
    }

    generateEnrollCommand(candidateNode, caNode) {
        if (caNode && !(caNode instanceof CaNode)) {
            console.log(`Not an instance`);
            return;
        }
        let command = [Commands.FABRIC_CA.FABRIC_CA_CLIENT, Commands.FABRIC_CA.ENROLL,
            "-u", `${!caNode ? candidateNode.url : `https://${candidateNode.name}:${candidateNode.secret}@${caNode.host}:${caNode.port}`}`,
            "-M", `${!caNode ? candidateNode.mspDir : `${caNode.isTls ? `tls-ca` : `org-ca`}/${candidateNode.name}/msp`}`,
            "--csr.hosts", candidateNode.csrHosts];

        if ((caNode && caNode.isTls)
            || (candidateNode instanceof CaNode
                && candidateNode.isTls))
            command = command.concat(["--enrollment.profile", `tls`]);

        return command.join(" ");
    }

    generateRegisterCommand(candidateNode, caNode) {
        if (!(caNode instanceof CaNode)) {
            console.log(`Not an instance`);
            return;
        }

        let command = [Commands.FABRIC_CA.FABRIC_CA_CLIENT, Commands.FABRIC_CA.REGISTER,
            `-d`,
            `--id.name ${candidateNode.name}`,
            `--id.secret ${candidateNode.secret}`,
            `--id.type ${candidateNode.nodeType}`,
            "-u", `https://${caNode.host}:${caNode.port}`,
            "-M", caNode.mspDir];

        return command.join(` `);
    }

    // peer channel fetch oldest -o $ORDERER_ADDRESS --cafile $ORDERER_TLS_CA --tls -c testchannel $PWD/Org1/peer1/testchannel.genesis.block
    generateFetchCommand(peerNode, ordererConfig, channelName, blockPath) {
        let command = [Commands.PEER.FETCH, Commands.PEER.FETCH_OLDEST,
            `-o ${ordererConfig.ordererAddress}`,
            `--cafile ${process.env.HOME}/ttz/orderers/${ordererConfig.ordererOrgName}-tls-ca-cert.pem`,
            `--tls`,
            `-c ${channelName}`,
            `${blockPath}`

        ];

        return command.join(" ");
    }

    generateJoinCommand(blockPath) {
        let command = [Commands.PEER.JOIN, `-b ${blockPath}`];
        return command.join(" ");
    }

    generateInstallCommand(packageName) {
        const command = [Commands.PEER.INSTALL,
        `${process.env.HOME}/ttz/chaincodes/${packageName}`];
        return command.join(" ");
    }

    generateApproveCommand(chaincodeConfig) {
        const command = [Commands.PEER.APPROVE,
            `-o ${chaincodeConfig.ordererAddress}`,
            `--channelID ${chaincodeConfig.channelId}`,
            `--name ${chaincodeConfig.ccName}`,
            `--version ${chaincodeConfig.version}`,
            `--package-id ${process.env.CC_PACKAGE_ID}`,
            `--sequence ${chaincodeConfig.seq}`,
            `--tls`,
            `--cafile ${process.env.HOME}/ttz/orderers/${chaincodeConfig.ordererOrgName}-tls-ca-cert.pem`]

        return command.join(" ");
    }

    generateCommitReadinessCommand(chaincodeConfig) {
        const command = [Commands.PEER.CHECK_COMMIT_READINESS,
            `--channelID ${chaincodeConfig.channelId}`,
            `--name ${chaincodeConfig.ccName}`,
            `--version ${chaincodeConfig.version}`,
            `--sequence ${chaincodeConfig.seq}`,
            `--tls`,
            `--cafile ${process.env.HOME}/ttz/orderers/${chaincodeConfig.ordererOrgName}-tls-ca-cert.pem`,
            `--output json`];

        return command.join(" ");
    }

    generateCommitCommand(commitConfig) {
        const command = [Commands.PEER.COMMIT,
            `-o ${commitConfig.ordererAddress}`,
            `--channelID ${commitConfig.channelId}`,
            `--name ${commitConfig.ccName}`,
            `--version ${commitConfig.version}`,
            `--sequence ${commitConfig.seq}`,
            `--tls`,
            `--cafile ${process.env.HOME}/ttz/orderers/${commitConfig.ordererOrgName}-tls-ca-cert.pem`];

        commitConfig.peers.forEach(peer => {
            let parameter = `--peerAddresses ${peer.peerAddress} --tlsRootCertFiles ${process.env.HOME}/ttz/tlsRootCerts/${peer.orgName}-tls-ca-cert.pem`;
            command.push(parameter);
        });

        return command.join(" ");
    }

    async prepareForCommit(chaincodeConfig) {
        let packageId = await this.getPackageId(chaincodeConfig.packageName);
        if (!packageId) {
            // install here
            packageId = await this.install(chaincodeConfig.packageName);
        }
        process.env.CC_PACKAGE_ID = packageId.package_id;
        return this.approve(chaincodeConfig);
    }

    async install(packageName) {
        await exec(this.generateInstallCommand(packageName));
        return this.getPackageId(packageName);
    }

    async approve(approveParams) {
        await exec(this.generateApproveCommand(approveParams));
        let { stdout, stderr } = await exec(this.generateCommitReadinessCommand(approveParams));
        const result = JSON.parse(stdout);
        return result.approvals;
    }

    async isReadyForCommit(readyParams) {
        let { stdout, stderr } = await exec(this.generateCommitReadinessCommand(readyParams));
        const result = JSON.parse(stdout);
        const values = Object.values(result).filter(element => !element);
        return !(values.length > 0);
    }

    async commitChaincode(commitConfig) {
        const { stdout, stderr } = await exec(this.generateCommitCommand(commitConfig));
        console.log(`[STDOUT COMMIT]: ${stdout}`);
    }

    extractLabel(packageName) {
        const packageSplit = packageName.split("@");
        const version = packageSplit[1].replace(`.tar.gz`, ``);
        return `${packageSplit[0]}_${version}`;
    }

    async getInstalledList() {
        const { stdout, stderr } = await exec(`${Commands.PEER.QUERY_INSTALLED} ${Commands.OS.TO_STDOUT}`);
        console.log(`stdout: ${stdout}`);
        const result = JSON.parse(stdout);
        console.log(result);
        return result;
    }

    async getPackageId(packageName) {
        const label = this.extractLabel(packageName);
        const result = await this.getInstalledList(packageName);
        if (!result.hasOwnProperty("installed_chaincodes")) return null;
        const filteredResult = result.installed_chaincodes.filter(element => element.label === label);
        // we expect label to be unique thus the filtered array will have one element or none
        return !filteredResult.length ? null : filteredResult[0];
    }

    createCliEnv(peerNode) {
        if (!peerNode instanceof PeerNode) {
            throw Error("The argument should be an instance of PeerNode");
        }

        process.env.CORE_PEER_LOCALMSPID = peerNode.orgName;
        process.env.CORE_PEER_ADDRESS = `${peerNode.host}:${peerNode.port}`;
        process.env.CORE_PEER_TLS_ROOTCERT_FILE = `${peerNode.BASE_PATH}/msp/tlscacerts/tls-ca-cert.pem`;
        process.env.CORE_PEER_MSPCONFIGPATH = `${peerNode.BASE_PATH}/fabric-ca/client/org-ca/org-admin/msp/`;
        process.env.CORE_PEER_TLS_ENABLED = `true`;
    }

    // docker run --name --network --port --volume --env-file IMAGE COMMAND

    async runContainerViaEngineApi(config) {
        await this.handleDockerNetwork();

        let createResponse = await this.dockerService.createContainer(config);
        await this.dockerService.connectContainerToNetwork(this.dockerNetworkName, {Container: createResponse.data.Id});
        await this.dockerService.startContainer({ Id: createResponse.data.Id });
    }

    async handleDockerNetwork() {
        if (!dockerNetworkExists) {
            try {
                await this.dockerService.checkNetwork(this.dockerNetworkName);
                dockerNetworkExists = true;
            } catch (e) {
                if(e.response.status === 404 )  {
                    await this.createNetwork();
                    return;
                }
                throw e;
            }
        }
    }
    
    async createNetwork() {
        try {
            await this.dockerService.createNetwork({Name: this.dockerNetworkName});
        } catch (e) {
            throw e;
        }
    }

    register(candidateNode, caNode) {
        let command = this.generateRegisterCommand(candidateNode, caNode);
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        childProcess.execSync(command);
    }

    registerAndEnroll(candidateNode, caNode) {
        this.register(candidateNode, caNode);
        this.caEnroll(candidateNode, caNode);
        candidateNode.arrangeFolderStructure(caNode);
    }

    caEnroll(candidateNode, caNode) {
        let command = caNode ? this.generateEnrollCommand(candidateNode, caNode)
            : this.generateEnrollCommand(candidateNode);
        childProcess.execSync(`cp ${candidateNode.BASE_PATH}/fabric-ca/server/tls-ca/crypto/ca-cert.pem ${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`)
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        console.log(`ENROLL CMD: ${command}`)
        childProcess.execSync(command)
    }

    caInitFolderPrep(node) {
        let paths = [`${node.BASE_PATH}/fabric-ca/server/tls-ca/crypto/`,
            `${node.BASE_PATH}/fabric-ca/server/org-ca/crypto/`,
            `${node.BASE_PATH}/fabric-ca/server/org-ca/tls/`,
            `${node.BASE_PATH}/fabric-ca/client/org-ca/`,
            `${node.BASE_PATH}/fabric-ca/client/tls-ca/`,
            `${process.env.HOME}/ttz/envFiles`]
            fileManager.mkdir(paths);
    }

    runBasicCmd(cmd) {
        childProcess.execSync(cmd);
    }

    printLog(error) {
        console.log(`ERROR\n${error.message}\n------------------\n${error.stack}`)
    }

    createMspFolder(caNode) {
        if (!(caNode instanceof CaNode)) {
            throw Error("Not an Ca instance")
        }

        let paths = [
            `${caNode.BASE_PATH}/msp/cacerts`,
            `${caNode.BASE_PATH}/msp/tlscacerts`
        ]
        fileManager.mkdir(paths);
        fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/config.yaml`, `${caNode.BASE_PATH}/msp/config.yaml`);
        childProcess.execSync(`cp ${caNode.BASE_PATH}/fabric-ca/client/org-ca/org-ca-admin/msp/cacerts/* ${caNode.BASE_PATH}/msp/cacerts/`)
        fileManager.copyFile(`${caNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`, `${caNode.BASE_PATH}/msp/tlscacerts/tls-ca-cert.pem`);
    }
}

if (require.main === module) {
    console.log('called directly');
} else {
    console.log('required as a module');
}


