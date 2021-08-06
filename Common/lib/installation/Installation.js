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
        logger.log({level: `debug`, message: `Approving chaincode: ${approveParams.ccName} for the channel ${approveParams.channelId}`});
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
        return JSON.parse(stdout);
    } catch (e) {
        throw new Errors.FabricError(`Queryinstalled Error`, e);
    }
}

async function _createNetwork(dockerService) {
    try {
        logger.log({level: `debug`, message: `Creating docker network`});
        await dockerService.createNetwork({Name: `ttz_docker_network`});
        logger.log({level: `debug`, message: `Docker network created`});
    } catch (e) {
        throw new Errors.DockerError(`NETWORK CREATION ERROR`, e);
    }
}

async function _handleDockerNetwork(dockerService) {
    logger.log({level: `debug`, message: `Handle docker network`});
    if (!dockerNetworkExists) {
        try {
            logger.log({level: `debug`, message: `Checking docker network`});
            await dockerService.checkNetwork(`ttz_docker_network`);
            logger.log({level: `debug`, message: `Docker network exists`});
            dockerNetworkExists = true;
        } catch (e) {
            if (e.hasOwnProperty(`response`) && e.response.status === 404) {
                logger.log({level: `debug`, message: `Docker network does not exist`});
                await _createNetwork(dockerService);
                return;
            }
            throw new Errors.DockerError(`CHECK NETWORK ERROR`, e);
        }
    }
}

async function _register(candidateNode, caNode) {
    try {
        logger.log({level: `debug`, message: `Registering ${candidateNode.name} to ${caNode.name}`});
        let command = FabricCommandGenerator.generateRegisterCommand(candidateNode, caNode);
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        logger.log({level: `debug`, message: `Register command: ${command}`});
        const { stdout, stderr } = await exec(command);
        logger.log({level: `debug`, message: `Register state: ${stdout}`});
    } catch (e) {
        throw new Errors.FabricError(`REGISTER NODE ERROR`, e);
    }
}

async function _caEnroll(candidateNode, caNode) {
    try {
        logger.log({level: `debug`, message: `Enrolling`});
        let command = caNode ? FabricCommandGenerator.generateEnrollCommand(candidateNode, caNode)
            : FabricCommandGenerator.generateEnrollCommand(candidateNode);
        await exec(`cp ${candidateNode.BASE_PATH}/fabric-ca/server/tls-ca/crypto/ca-cert.pem ${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`)
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        logger.log({level: `debug`, message: `Enroll command: ${command}`});
        const { stdout, stderr } = await exec(command);
        logger.log({level: `debug`, message: `Enroll state: ${stdout}`});
    } catch (e) {
        throw new Errors.FabricError(`CA ENROLL ERROR`, e);
    }
}

async function _joinChannel(blockPath) {
    try {
        logger.log({level: `debug`, message: `Joining channel using the genesis block: ${blockPath}`});
        const command = FabricCommandGenerator.generateJoinCommand(blockPath);
        const {stdout, stderr } = await exec(command);
        logger.log({level: `debug`, message: `Join state: ${stdout}`});
    } catch (e) {
        throw new Errors.FabricError(`JOIN CHANNEL ERROR`, e);
    }
}

async function _fetchGenesisBlock(peerNode, ordererConfig, channelName, blockPath) {
    try {
        logger.log({level: `debug`, message: `Fetching the genesis block from orderer: ${ordererConfig}`});
        const command = FabricCommandGenerator.generateFetchCommand(peerNode, ordererConfig, channelName, blockPath);
        const {stdout, stderr } = await exec(command);
        logger.log({level: `debug`, message: `Fetch state: ${stdout}`});
    } catch (e) {
        throw new Errors.FabricError(`FETCH GENESIS ERROR`, e);
    }
}

async function _commitChaincode(commitConfig) {
    try {
        logger.log({level: `debug`, message: `Commiting the chaincode using the configuration: ${commitConfig}`});
        const {stdout, stderr} = await exec(FabricCommandGenerator.generateCommitCommand(commitConfig));
        logger.log({level: `debug`, message: `Commit state: ${stdout}`});
    } catch (e) {
        throw new Errors.FabricError(`COMMIT CC ERROR`, e);
    }
}

async function _runContainerViaEngineApi(dockerService, config) {
    logger.log({level: `debug`, message: `Running container via engine api: ${config}`});
    try {
        await _handleDockerNetwork(dockerService);
        logger.log({level: `debug`, message: `Creating the container`});
        let createResponse = await dockerService.createContainer(config);
        logger.log({level: `debug`, message: `Container created`});
        logger.log({level: `debug`, message: `Connecting to the docker network`});
        await dockerService.connectContainerToNetwork(`ttz_docker_network`, {Container: createResponse.data.Id});
        logger.log({level: `debug`, message: `Connected to the docker network`});
        logger.log({level: `debug`, message: `Starting the docker container`});
        await dockerService.startContainer({Id: createResponse.data.Id});
        logger.log({level: `debug`, message: `Docker container started`});
    } catch (e) {
        if (e instanceof Errors.DockerError) throw e;
        throw new Errors.DockerError(`RUN CONTAINER ERROR`, e);
    }
}

function _createMspFolder(caNode) {
    logger.log({level: `debug`, message: `Creating MSP folder`});
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
        logger.log({level: `debug`, message: `MSP Folder created`});
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

    async registerAndEnroll(candidateNode, caNode) {
        await _register(candidateNode, caNode);
        await _caEnroll(candidateNode, caNode);
        candidateNode.arrangeFolderStructure(caNode);
    }

    async caEnroll(candidateNode, caNode) {
        await _caEnroll(candidateNode, caNode);
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

    async runBasicCmd(optName, cmd) {
        const { stdout, stderr } = await exec(cmd);
        logger.log({level: `debug`, message: `${optName} state: ${stdout}`});
    }

    printLog(error) {
        console.log(`ERROR\n${error.message}\n------------------\n${error.stack}`)
    }

    createMspFolder(caNode) {
        _createMspFolder(caNode)
    }
}