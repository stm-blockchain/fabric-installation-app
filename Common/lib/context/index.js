const fileManager = require("../files");
const fs = require("fs");
const config = require("./config");
const dockerConfig = require(`../dockerConfig`);
const db = require("../db")
const dockerApi = require("../dockerApi");
const dockerService = new dockerApi();
const CaNode = require("../CaNode");
const PeerNode = require("../PeerNode");
const OrdererNode = require("../OrdererNode");
const BaseNode = require("../BaseNode");
const { v4: uuidv4 } = require('uuid');

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

let CA_NODES = {};
let PEER_NODES = [];
let ORDERER_NODES = [];
let dockerNetworkExists = false;

function folderPrep() {
    let folderExists = fs.existsSync(`${process.env.HOME}/ttz/data`);
    folderExists ? console.log("Data folder already exists")
        : fileManager.mkdir([`${process.env.HOME}/ttz/data`]);
}

async function runPostgres() {
   try {
       let response = await dockerService.createContainer(postgresDockerConfig);
       await dockerService.startContainer({ Id: response.data.Id });
   } catch (e) {
       console.log(`Db container could not start properly: ${e.response.message}`);
       console.log(e.stack);
       process.exit(dockerConfig.SERVER_ERROR);
   }
}

async function createTables() {
    const client = await db.connect();
    try {
        await client.query(`CREATE TABLE base_nodes ( node_id uuid PRIMARY KEY, name VARCHAR(50), secret VARCHAR(50), org_name VARCHAR(50), csr_hosts VARCHAR(50), port INT NOT NULL, type INT NOT NULL);`);
        await client.query(`CREATE TABLE orderer_nodes ( orderer_id uuid PRIMARY KEY, node_id uuid NOT NULL, admin_name VARCHAR(50), admin_secret VARCHAR(50),FOREIGN KEY (node_id) REFERENCES base_nodes (node_id));`);
        await client.query(`CREATE TABLE ca_nodes ( ca_id uuid PRIMARY KEY, node_id uuid NOT NULL, admin_name VARCHAR(50), admin_secret VARCHAR(50), is_tls BOOLEAN NOT NULL,FOREIGN KEY (node_id) REFERENCES base_nodes (node_id));`);
    } catch (e) {
        console.log(`${e.message}: \n${e.stack}`);
    } finally {
        client.release();
    }
}

async function fetcNodes() {
    let nodes = {};
    let response;
    let ordererQuery = `SELECT * FROM base_nodes INNER JOIN orderer_nodes ON base_nodes.node_id = orderer_nodes.node_id`;
    let caQuery = `SELECT * FROM base_nodes INNER JOIN ca_nodes ON base_nodes.node_id = ca_nodes.node_id`;
    const client = await db.connect();
    try {
        response = await client.query(caQuery);
        nodes.caNodes = response.rows;
        response = await client.query(ordererQuery);
        nodes.ordererNodes = response.rows;
        response = await client.query("SELECT * FROM base_nodes WHERE base_nodes.type = $1", ["2"]);
        nodes.peerNodes = response.rows;
        return nodes;
    } catch (e) {
        console.log(`${e.message}: \n${e.stack}`);
        return null;
    } finally {
        client.release();
    }
}

function loadNodeObjects(nodes) {
    nodes.caNodes.forEach(caNode => {
        let nodeObject = new CaNode(caNode.name, caNode.secret, caNode.port, caNode.org_name,
            caNode.is_tls, caNode.csr_hosts, caNode.admin_name, caNode.admin_secret);
        caNode.is_tls ? CA_NODES.tlsCaNode = nodeObject : CA_NODES.orgCaNode = nodeObject;
    });

    nodes.peerNodes.forEach(peerNode => {
        PEER_NODES.push(new PeerNode(peerNode.name, peerNode.secret, peerNode.org_name,
            peerNode.port, peerNode.csr_hosts));
    });

    nodes.ordererNodes.forEach(ordererNode => {
        ORDERER_NODES.push(new OrdererNode(ordererNode.name, ordererNode.secret, ordererNode.org_name,
            ordererNode.port, ordererNode.admin_name, ordererNode.admin_secret));
    })
}

function prepareQueries(node) {
    let node_id = uuidv4();
    let type_id = uuidv4();
    let baseQuery = `INSERT INTO base_nodes(node_id, name, secret, org_name, csr_hosts, port, type) ` +
        `VALUES (${`\'${node_id}\'`}, '${node.name}', '${node.secret}', '${node.orgName}', ${node.csrHosts}, ${node.port}, ${node.type});`
    let nodeQuery = ``;
    switch (node.constructor) {
        case CaNode:
            nodeQuery = `INSERT INTO ca_nodes(ca_id, node_id, admin_name, admin_secret, is_tls) VALUES (${`\'${type_id}\'`}, ${`\'${node_id}\'`}, ${node.isTls ? null : `\'${node.adminName}\'`}, ${node.isTls ? null :  `\'${node.adminSecret}\'`}, ${node.isTls});`
            break;
        case PeerNode:
            break;
        case OrdererNode:
            nodeQuery = `INSERT INTO orderer_nodes(orderer_id, node_id, admin_name, admin_secret) VALUES (${`\'${type_id}\'`}, ${`\'${node_id}\'`}, ${`\'${node.adminName}\'`}, ${`\'${node.adminPw}\'`});`
            break;
    }
    return { baseQuery: baseQuery, nodeQuery: nodeQuery };
}

async function writeNode(queries) {
    const client = await db.connect();
    try {
        await client.query(queries.baseQuery);
        await client.query(queries.nodeQuery);
    } catch (e) {
        console.log(`${e.message}: \n${e.stack}`);
    } finally {
        client.release();
    }
}

async function checkContainerExists() {
    try {
        let response = await dockerService.inspectContainer(config.name);
        return response.data.State.Running ? DB_CONTAINER_STATUS.CONTAINER_ALREADY_UP
            : DB_CONTAINER_STATUS.CONTAINER_DOWN;
    } catch (e) {
        if (e.response.status === dockerConfig.NO_SUCH_CONTAINER) {
            return DB_CONTAINER_STATUS.NO_SUCH_CONTAINER;
        }
        console.log(`Docker Engine Error`);
        console.log(e.stack);
        process.exit(dockerConfig.SERVER_ERROR);
    }
}

async function removeAndRerunContainer() {
    try {
        await dockerService.removeContainerFromNetwork(config.name);
        let response = await dockerService.createContainer(postgresDockerConfig);
        await dockerService.startContainer({ Id: response.data.Id });
    } catch (e) {
        console.log(`Db container could not start properly: ${e.response.message}`);
        console.log(e.stack);
        process.exit(dockerConfig.SERVER_ERROR);
    }
}

async function initDbContainer() {
    let containerStatus = await checkContainerExists();
    switch (containerStatus) {
        case DB_CONTAINER_STATUS.CONTAINER_ALREADY_UP:
            console.log(`Do nothing`);
            break;
        case DB_CONTAINER_STATUS.CONTAINER_DOWN:
            await removeAndRerunContainer();
            break;
        case DB_CONTAINER_STATUS.NO_SUCH_CONTAINER:
            await runPostgres();
            break;
    }
}

function updateContextObject(node) {
    switch (node.constructor) {
        case CaNode:
            node.isTls ? CA_NODES.tlsCaNode = node :
                CA_NODES.orgCaNode = node;
            break;
        case PeerNode:
            PEER_NODES.push(node);
            break;
        case OrdererNode:
            ORDERER_NODES.push(node);
            break;
    }
}

async function updateContextDb(node) {
    try {
        let queries = prepareQueries(node);
        await writeNode(queries);
    } catch (e) {
        console.log(`Error when updating db: ${e.message}`);
        console.log(e.stack);
    }
}

module.exports = {
    CA_NODES: CA_NODES,
    PEER_NODES: PEER_NODES,
    ORDERER_NODES: ORDERER_NODES,
    dockerNetworkExists: dockerNetworkExists,
    init: async () => {
        try {
            folderPrep();
            await initDbContainer();
            await new Promise(r => setTimeout(r, 2000));
            await createTables();
            let nodes = await fetcNodes();
            loadNodeObjects(nodes);
        } catch (e) {
            console.log(e.message);
            console.log(e.stack);
        }
    },
    writeNode: async (node) => {
        await writeNode(prepareQueries(node));
    },
    updateContext: async (node) => {
        updateContextObject(node);
        await updateContextDb(node);
    }
}

if (require.main === module) {
    console.log('called directly');
} else {
    console.log('required as a module');
}

