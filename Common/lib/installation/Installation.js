const childProcess = require("child_process");
const util = require("util");
const exec = util.promisify(childProcess.exec);
const CaNode = require(`../CaNode`);
const PeerNode = require(`../PeerNode`);
const Errors = require(`../error`);
const fileManager = require("../files");
const FabricCommandGenerator = require(`./FabricCommandGenerator`);

let dockerNetworkExists = false
let logger;

async function _getPackageId(packageName) {
    try{
        logger.log({level: `debug`, message: `Get Package ID`});
        const label = _extractLabel(packageName);
        const result = await _getInstalledList(packageName);
        if (!result.hasOwnProperty("installed_chaincodes")) return null;
        const filteredResult = result.installed_chaincodes.filter(element => element.label === label);
        // we expect label to be unique thus the filtered array will have one element or none
        logger.log({level: `debug`, message: `Get Package ID successful`});
        return !filteredResult.length ? null : filteredResult[0];
    } catch (e) {
        if (e instanceof Errors.FabricError) throw e;
        throw new Errors.FabricError(`PACKAGING ERROR`, e);
    }
}

async function _install(packageName) {
    try {
        logger.log({level: `debug`, message: `Installing chaincode: ${packageName}`});
        await exec(FabricCommandGenerator.generateInstallCommand(packageName));
        logger.log({level: `debug`, message: `Chaincode ${packageName} installed successfully`});
        return _getPackageId(packageName);
    } catch (e) {
        if (e instanceof Errors.FabricError) throw e;
        throw new Errors.FabricError(`INSTALLATION ERROR`, e);
    }
}

async function _approve(approveParams) {
    try {
        logger.log({level: `debug`, message: `Approving chaincode: ${chaincodeConfig.ccName} for the channel ${chaincodeConfig.channelId}`});
        await exec(FabricCommandGenerator.generateApproveCommand(approveParams));
        let {stdout, stderr} = await exec(FabricCommandGenerator.generateCommitReadinessCommand(approveParams));
        logger.log({level: `debug`, message: `Approve state: ${stdout}`});
        const result = JSON.parse(stdout);
        return result.approvals;
    } catch (e) {
        throw new Errors.FabricError(`APPROVAL ERROR`, e)
    }
}

async function _isReadyForCommit(readyParams) {
    try {
        logger.log({level: `debug`, message: `Checking commit readiness of chaincode ${readyParams.ccName} for channel ${readyParams.channelId}`});
        let {stdout, stderr} = await exec(FabricCommandGenerator.generateCommitReadinessCommand(readyParams));
        logger.log({level: `debug`, message: `Commit readiness state: ${stdout}`});
        const result = JSON.parse(stdout);
        const values = Object.values(result).filter(element => !element);
        return !(values.length > 0);
    } catch (e) {
        throw new Errors.FabricError(`COMMITREADINESS ERROR`, e);
    }
}

function _extractLabel(packageName) {
    logger.log({level: `debug`, message: `Extracting label for package name: ${packageName}`});
    const packageSplit = packageName.split("@");
    const version = packageSplit[1].replace(`.tar.gz`, ``);
    logger.log({level: `debug`, message: `Label extracted successfully`});
    return `${packageSplit[0]}_${version}`;
}

async function _getInstalledList() {
    try {
        logger.log({level: `debug`, message: `Getting installed chaincode list`});
        const {stdout, stderr} = await exec(`${FabricCommandGenerator.Commands.PEER.QUERY_INSTALLED} ${FabricCommandGenerator.Commands.OS.TO_STDOUT}`);
        logger.log({level: `debug`, message: `List of installed chaincodes: ${stdout}`});
        const result = JSON.parse(stdout);
        return result;
    } catch (e) {
        throw new Errors.FabricError(`Queryinstalled Error`, e);
    }
}

async function _createNetwork(dockerService) {
    try {
        logger.log({level: `debug`, message: `List of installed chaincodes: ${stdout}`});
        await dockerService.createNetwork({Name: `ttz_docker_network`});
    } catch (e) {
        throw new Errors.DockerError(`NETWORK CREATION ERROR`, e);
    }
}

async function _handleDockerNetwork(dockerService) {
    if (!dockerNetworkExists) {
        try {
            await dockerService.checkNetwork(`ttz_docker_network`);
            dockerNetworkExists = true;
        } catch (e) {
            if (e.hasOwnProperty(`response`) && e.response.status === 404) {
                await _createNetwork(dockerService);
                return;
            }
            throw new Errors.DockerError(`CHECK NETWORK ERROR`, e);
        }
    }
}

function _register(candidateNode, caNode) {
    try {
        let command = FabricCommandGenerator.generateRegisterCommand(candidateNode, caNode);
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        childProcess.execSync(command);
    } catch (e) {
        throw new Errors.FabricError(`REGISTER NODE ERROR`, e);
    }
}

function _caEnroll(candidateNode, caNode) {
    try {
        let command = caNode ? FabricCommandGenerator.generateEnrollCommand(candidateNode, caNode)
            : FabricCommandGenerator.generateEnrollCommand(candidateNode);
        childProcess.execSync(`cp ${candidateNode.BASE_PATH}/fabric-ca/server/tls-ca/crypto/ca-cert.pem ${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`)
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        console.log(`ENROLL CMD: ${command}`)
        childProcess.execSync(command)
    } catch (e) {
        throw new Errors.FabricError(`CA ENROLL ERROR`, e);
    }
}

async function _joinChannel(blockPath) {
    try {
        const command = FabricCommandGenerator.generateJoinCommand(blockPath);
        await exec(command);
    } catch (e) {
        throw new Errors.FabricError(`JOIN CHANNEL ERROR`, e);
    }
}

async function _fetchGenesisBlock(peerNode, ordererConfig, channelName, blockPath) {
    try {
        const command = FabricCommandGenerator.generateFetchCommand(peerNode, ordererConfig, channelName, blockPath);
        await exec(command);
    } catch (e) {
        throw new Errors.FabricError(`FETCH GENESIS ERROR`, e);
    }
}

async function _commitChaincode(commitConfig) {
    try {
        const {stdout, stderr} = await exec(FabricCommandGenerator.generateCommitCommand(commitConfig));
        console.log(`[STDOUT COMMIT]: ${stdout}`);
    } catch (e) {
        throw new Errors.FabricError(`COMMIT CC ERROR`, e);
    }
}

async function _runContainerViaEngineApi(dockerService, config) {
    try {
        await _handleDockerNetwork(dockerService);

        let createResponse = await dockerService.createContainer(config);
        await dockerService.connectContainerToNetwork(`ttz_docker_network`, {Container: createResponse.data.Id});
        await dockerService.startContainer({Id: createResponse.data.Id});
    } catch (e) {
        if (e instanceof Errors.DockerError) throw e;
        throw new Errors.DockerError(`RUN CONTAINER ERROR`, e);
    }
}

function _createMspFolder(caNode) {
    if (!(caNode instanceof CaNode)) {
        throw new Errors.NodeTypeError(`ERROR \'caNode\' is not an instance of CaNode`, new Error());
    }

    try {
        const paths = [
            `${caNode.BASE_PATH}/msp/cacerts`,
            `${caNode.BASE_PATH}/msp/tlscacerts`
        ]
        fileManager.mkdir(paths);
        fileManager.copyFile(`${process.env.FABRIC_CFG_PATH}/config.yaml`, `${caNode.BASE_PATH}/msp/config.yaml`);
        childProcess.execSync(`cp ${caNode.BASE_PATH}/fabric-ca/client/org-ca/org-ca-admin/msp/cacerts/* ${caNode.BASE_PATH}/msp/cacerts/`)
        fileManager.copyFile(`${caNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`, `${caNode.BASE_PATH}/msp/tlscacerts/tls-ca-cert.pem`);
    } catch (e) {
        if (e instanceof Errors.BaseError) throw e;
        throw new Errors.FolderStructureError(`ERROR CREATE MSP FOLDER`, e);
    }
}

function _setLogger(loggerInstance) {
    logger = loggerInstance;
}

module.exports = class Installation {

    constructor(dockerService, loggerInstance) {
        this.dockerService = dockerService;
        _setLogger(loggerInstance);
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
        return _commitChaincode(commitConfig);
    }

    async isReadyForCommit(commitConfig) {
        return _isReadyForCommit(commitConfig);
    }

    createCliEnv(peerNode) {
        if (!peerNode instanceof PeerNode) {
            throw new Errors.NodeTypeError(`CLI ENV ERROR: Given object is not an instance of PeerNode`, e);
        }

        process.env.CORE_PEER_LOCALMSPID = peerNode.orgName;
        process.env.CORE_PEER_ADDRESS = `${peerNode.host}:${peerNode.port}`;
        process.env.CORE_PEER_TLS_ROOTCERT_FILE = `${peerNode.BASE_PATH}/msp/tlscacerts/tls-ca-cert.pem`;
        process.env.CORE_PEER_MSPCONFIGPATH = `${peerNode.BASE_PATH}/fabric-ca/client/org-ca/org-admin/msp/`;
        process.env.CORE_PEER_TLS_ENABLED = `true`;
    }

    async runContainerViaEngineApi(config) {
        return  _runContainerViaEngineApi(this.dockerService, config);
    }

    async joinChannel(blockPath) {
        return  _joinChannel(blockPath);
    }

    async fetchGenesisBlock(peerNode, ordererConfig, channelName, blockPath) {
        return _fetchGenesisBlock(peerNode, ordererConfig, channelName, blockPath);
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
        _createMspFolder(caNode)
    }
}