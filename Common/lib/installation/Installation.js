const childProcess = require("child_process");
const util = require("util");
const exec = util.promisify(childProcess.exec);
const CaNode = require(`../CaNode`);
const PeerNode = require(`../PeerNode`);
const fileManager = require("../files");
const FabricCommandGenerator = require(`./FabricCommandGenerator`);

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

let dockerNetworkExists = false

async function _getPackageId(packageName) {
    const label = _extractLabel(packageName);
    const result = await _getInstalledList(packageName);
    if (!result.hasOwnProperty("installed_chaincodes")) return null;
    const filteredResult = result.installed_chaincodes.filter(element => element.label === label);
    // we expect label to be unique thus the filtered array will have one element or none
    return !filteredResult.length ? null : filteredResult[0];
}

async function _install(packageName) {
    await exec(FabricCommandGenerator.generateInstallCommand(packageName));
    return _getPackageId(packageName);
}

async function _approve(approveParams) {
    await exec(FabricCommandGenerator.generateApproveCommand(approveParams));
    let {stdout, stderr} = await exec(FabricCommandGenerator.generateCommitReadinessCommand(approveParams));
    const result = JSON.parse(stdout);
    return result.approvals;
}

async function _isReadyForCommit(readyParams) {
    let {stdout, stderr} = await exec(FabricCommandGenerator.generateCommitReadinessCommand(readyParams));
    const result = JSON.parse(stdout);
    const values = Object.values(result).filter(element => !element);
    return !(values.length > 0);
}

function _extractLabel(packageName) {
    const packageSplit = packageName.split("@");
    const version = packageSplit[1].replace(`.tar.gz`, ``);
    return `${packageSplit[0]}_${version}`;
}

async function _getInstalledList() {
    const {stdout, stderr} = await exec(`${Commands.PEER.QUERY_INSTALLED} ${Commands.OS.TO_STDOUT}`);
    console.log(`stdout: ${stdout}`);
    const result = JSON.parse(stdout);
    console.log(result);
    return result;
}

async function _createNetwork(dockerService) {
    try {
        await dockerService.createNetwork({Name: `ttz_docker_network`});
    } catch (e) {
        throw e;
    }
}

async function _handleDockerNetwork(dockerService) {
    if (!dockerNetworkExists) {
        try {
            await dockerService.checkNetwork(`ttz_docker_network`);
            dockerNetworkExists = true;
        } catch (e) {
            if (e.response.status === 404) {
                await _createNetwork(dockerService);
                return;
            }
            throw e;
        }
    }
}

function _register(candidateNode, caNode) {
    let command = FabricCommandGenerator.generateRegisterCommand(candidateNode, caNode);
    process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
    process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
    childProcess.execSync(command);
}

function _caEnroll(candidateNode, caNode) {
    let command = caNode ? FabricCommandGenerator.generateEnrollCommand(candidateNode, caNode)
        : FabricCommandGenerator.generateEnrollCommand(candidateNode);
    childProcess.execSync(`cp ${candidateNode.BASE_PATH}/fabric-ca/server/tls-ca/crypto/ca-cert.pem ${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`)
    process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
    process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
    console.log(`ENROLL CMD: ${command}`)
    childProcess.execSync(command)
}

async function _joinChannel(blockPath) {
    const command = FabricCommandGenerator.generateJoinCommand(blockPath);
    await exec(command);
}

async function _fetchGenesisBlock(peerNode, ordererConfig, channelName, blockPath) {
    const command = FabricCommandGenerator.generateFetchCommand(peerNode, ordererConfig, channelName, blockPath);
    await exec(command);
}

module.exports = class Installation {

    constructor(dockerService) {
        this.dockerService = dockerService;
    }

    async prepareForCommit(chaincodeConfig) {
        let packageId = await _getPackageId(chaincodeConfig.packageName);
        if (!packageId) {
            // install here
            packageId = await _install(chaincodeConfig.packageName);
        }
        process.env.CC_PACKAGE_ID = packageId.package_id;
        return _approve(chaincodeConfig);
    }

    async commitChaincode(commitConfig) {
        const {stdout, stderr} = await exec(FabricCommandGenerator.generateCommitCommand(commitConfig));
        console.log(`[STDOUT COMMIT]: ${stdout}`);
    }

    async isReadyForCommit(commitConfig) {
        return _isReadyForCommit(commitConfig);
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

    async runContainerViaEngineApi(config) {
        await _handleDockerNetwork(this.dockerService);

        let createResponse = await this.dockerService.createContainer(config);
        await this.dockerService.connectContainerToNetwork(`ttz_docker_network`, {Container: createResponse.data.Id});
        await this.dockerService.startContainer({Id: createResponse.data.Id});
    }

    async joinChannel(blockPath) {
        await _joinChannel(blockPath);
    }

    async fetchGenesisBlock(peerNode, ordererConfig, channelName, blockPath) {
        await _fetchGenesisBlock(peerNode, ordererConfig, channelName, blockPath);
    }

    registerAndEnroll(candidateNode, caNode) {
        _register(candidateNode, caNode);
        _caEnroll(candidateNode, caNode);
        candidateNode.arrangeFolderStructure(caNode);
    }

    caEnroll(candidateNode, caNode) {
        _caEnroll(candidateNode, caNode);
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
    // prepareForCommit: async (chaincodeConfig) => {
    //     let packageId = await getPackageId(chaincodeConfig.packageName);
    //     if (!packageId) {
    //         // install here
    //         packageId = await install(chaincodeConfig.packageName);
    //     }
    //     process.env.CC_PACKAGE_ID = packageId.package_id;
    //     return approve(chaincodeConfig);
    // },
    // commitChaincode: async (commitConfig) => {
    //     const { stdout, stderr } = await exec(FabricCommandGenerator.generateCommitCommand(commitConfig));
    //     console.log(`[STDOUT COMMIT]: ${stdout}`);
    // },
    // isReadyForCommit: async () => {
    //     return isReadyForCommit();
    // },
    // createCliEnv: (peerNode) => {
    //     if (!peerNode instanceof PeerNode) {
    //         throw Error("The argument should be an instance of PeerNode");
    //     }
    //
    //     process.env.CORE_PEER_LOCALMSPID = peerNode.orgName;
    //     process.env.CORE_PEER_ADDRESS = `${peerNode.host}:${peerNode.port}`;
    //     process.env.CORE_PEER_TLS_ROOTCERT_FILE = `${peerNode.BASE_PATH}/msp/tlscacerts/tls-ca-cert.pem`;
    //     process.env.CORE_PEER_MSPCONFIGPATH = `${peerNode.BASE_PATH}/fabric-ca/client/org-ca/org-admin/msp/`;
    //     process.env.CORE_PEER_TLS_ENABLED = `true`;
    // }
}