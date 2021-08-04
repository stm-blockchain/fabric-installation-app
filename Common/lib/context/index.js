const fileManager = require("../files");
const fs = require("fs");
const config = require("./config");
const dockerConfig = require(`../dockerConfig`);
const dockerApi = require("../dockerApi");
const dockerService = new dockerApi();
const repository = require(`./ContextRepository`);
const Errors = require(`../error`);

const DB_CONTAINER_STATUS= {
    CONTAINER_ALREADY_UP: 1,
    CONTAINER_DOWN: 2,
    NO_SUCH_CONTAINER: 3
}

const port = `${config.port}/tcp`;
const postgresDockerConfig = {
    Name: `${config.name}`,
    Image: "postgres",
    Env: [`POSTGRES_USER=${config.dbUserName}`, `POSTGRES_PASSWORD=${config.dbPassword}`, `POSTGRES_DB=${config.dbName}`],
    ExposedPorts: {
        [port]: {}
    },
    HostConfig: {
        Binds: [`${process.env.HOME}/ttz/data:/var/lib/postgresql/data`],
        PortBindings: {
            [port]: [{HostPort: "5432"}]
        }
    }
}

let dockerNetworkExists = false;
let logger;

function _folderPrep() {
    let folderExists = fs.existsSync(`${process.env.HOME}/ttz/data`);
    folderExists ? console.log("Data folder already exists")
        : fileManager.mkdir([`${process.env.HOME}/ttz/data`,
            `${process.env.HOME}/ttz/chaincodes`,
            `${process.env.HOME}/ttz/orderers`,
            `${process.env.HOME}/ttz/tlsRootCerts`]);
}

async function _runPostgres() {
   try {
       const response = await dockerService.createContainer(postgresDockerConfig);
       await dockerService.startContainer({ Id: response.data.Id });
   } catch (e) {
       throw new Errors.DockerError(`ERROR RUNNING DB CONTAINER`, e);
   }
}

async function _checkContainerExists() {
    try {
        let response = await dockerService.inspectContainer(config.name);
        return response.data.State.Running ? DB_CONTAINER_STATUS.CONTAINER_ALREADY_UP
            : DB_CONTAINER_STATUS.CONTAINER_DOWN;
    } catch (e) {
        if (e.response.status === dockerConfig.NO_SUCH_CONTAINER) {
            return DB_CONTAINER_STATUS.NO_SUCH_CONTAINER;
        }
        throw new Errors.DockerError(`CHECK CONTAINER EXISTS ERROR`, e);
    }
}

async function _removeAndRerunContainer() {
    try {
        await dockerService.removeContainerFromNetwork(config.name);
        let response = await dockerService.createContainer(postgresDockerConfig);
        await dockerService.startContainer({ Id: response.data.Id });
    } catch (e) {
        throw new Errors.DockerError(`REMOVE-RERUN ERROR DB CONTAINER`, e);
    }
}

async function _initDbContainer() {
    let containerStatus = await _checkContainerExists();
    switch (containerStatus) {
        case DB_CONTAINER_STATUS.CONTAINER_ALREADY_UP:
            console.log(`Do nothing`);
            break;
        case DB_CONTAINER_STATUS.CONTAINER_DOWN:
            await _removeAndRerunContainer();
            break;
        case DB_CONTAINER_STATUS.NO_SUCH_CONTAINER:
            await _runPostgres();
            break;
    }
}

function _setLogger(loggerInstance) {
    logger = loggerInstance;
}

module.exports = {
    CA_NODES: repository.getCaNodes(),
    PEER_NODES: repository.getPeerNodes(),
    ORDERER_NODES: repository.getOrdererNodes(),
    dockerNetworkExists: dockerNetworkExists,
    init: async () => {
        _folderPrep();
        await _initDbContainer();
        await new Promise(r => setTimeout(r, 4000)); // Should know when postgres server is up
        await repository.init();
    },
    updateContext: async (node) => {
        await repository.updateContext(node);
    },
    getPeer: (peerConfig) => {
        return repository.getPeerByName(peerConfig);
    },
    setLogger: (loggerInstace) => {
        _setLogger(loggerInstace);
    }
}

if (require.main === module) {
    console.log('called directly');
} else {
    console.log('required as a module');
}
