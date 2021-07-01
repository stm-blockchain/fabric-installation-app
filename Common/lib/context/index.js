const fileManager = require("../files");
const fs = require("fs");
const config = require("./config");
const db = require("../db")
const dockerApi = require("../dockerApi");
const dockerService = new dockerApi();

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

let CA_NODES = {};
let PEER_NODES = {}
let ORDERER_NODES = {}

function folderPrep() {
    let folderExists = fs.existsSync(`${process.env.HOME}/ttz/data`);
    folderExists ? console.log("Data folder already exists")
        : fileManager.mkdir([`${process.env.HOME}/ttz/data`]);
}

async function runPostgres() {
    let response = await dockerService.createContainer(postgresDockerConfig);
    await dockerService.startContainer({ Id: response.data.Id });
}

async function loadNodes() {
    let nodes = {};
    let response;
    let ordererQuery = `SELECT * FROM base_nodes INNER JOIN orderer_nodes ON base_nodes.node_id = orderer_nodes.node_id`;
    let caQuery = `SELECT * FROM base_nodes INNER JOIN ca_nodes ON base_nodes.node_id = ca_nodes.node_id`;
    response = await db.query(caQuery);
    nodes.caNodes = response.rows;
    response = await db.query(ordererQuery);
    nodes.ordererNodes = response.rows;
    response = await db.query("SELECT * FROM base_nodes WHERE base_nodes.type = $1", ["2"]);
    nodes.peerNodes = response.rows;
    return nodes;
}

/**
 * Scenero 1: Clean start
 * - Container starts
 * - Checks if the there is any data if none exist
 * - Context object is created with empty subobjects
 * - Context objects checks the local docker network
 * - Init function returns the context object to be injected to the installation instance
 * Scenaro 2: Starting after app process killed but the network is still up
 * - Container starts with data/ folder is binded into it
 * -
 */

module.exports.init = async () => {
    try {
        folderPrep();
        await runPostgres();
    } catch (e) {
        console.log(e.response.data.message);
        if (e.response.status === 409) {
            await dockerService.removeContainerFromNetwork(config.name);
        }
    }
}

// module.exports = {
//     CA_NODES,
//     PEER_NODES,
//     ORDERER_NODES
// }
if (require.main === module) {
    console.log('called directly');
    (async () => {
        let nodes = await loadNodes();
        console.log(nodes);
    })().catch(e => console.log(e.stack)).finally(async () => await db.endPool())
} else {
    console.log('required as a module');
}

