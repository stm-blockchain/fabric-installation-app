const fileManager = require("../files");
const fs = require("fs");
const config = require("./config");
const db = require("../db")
const dockerApi = require("../dockerApi");
const dockerService = new dockerApi();
const CaNode = require("../CaNode");
const PeerNode = require("../PeerNode");
const OrdererNode = require("../OrdererNode");
const BaseNode = require("../BaseNode");
const { v4: uuidv4 } = require('uuid');

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
let PEER_NODES = {};
let ORDERER_NODES = {};
let dockerNetworkExists = false;

function folderPrep() {
    let folderExists = fs.existsSync(`${process.env.HOME}/ttz/data`);
    folderExists ? console.log("Data folder already exists")
        : fileManager.mkdir([`${process.env.HOME}/ttz/data`]);
}

async function runPostgres() {
    let response = await dockerService.createContainer(postgresDockerConfig);
    await dockerService.startContainer({ Id: response.data.Id });
}

async function createTables() {
    const client = await db.connect();
    try {
        await client.query(`CREATE TABLE base_nodes ( node_id serial PRIMARY KEY, name VARCHAR(50), secret VARCHAR(50), org_name VARCHAR(50), csr_hosts VARCHAR(50), port INT NOT NULL, type INT NOT NULL);`);
        await client.query(`CREATE TABLE orderer_nodes ( orderer_id serial PRIMARY KEY, node_id serial NOT NULL, admin_name VARCHAR(50), admin_secret VARCHAR(50),FOREIGN KEY (node_id) REFERENCES base_nodes (node_id));`);
        await client.query(`CREATE TABLE ca_nodes ( ca_id serial PRIMARY KEY, node_id serial NOT NULL, admin_name VARCHAR(50), admin_secret VARCHAR(50), is_tls BOOLEAN NOT NULL,FOREIGN KEY (node_id) REFERENCES base_nodes (node_id));`);
    } catch (e) {
        console.log(`${e.message}: \n${e.stack}`);
        process.exit(131);
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
        CA_NODES.push(new CaNode(caNode.name, caNode.secret, caNode.port,
            caNode.org_name, caNode.is_tls, caNode.csr_hosts));
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
    let node_id = 3;
    let baseQuery = `INSERT INTO base_nodes(node_id, name, secret, org_name, csr_hosts, port, type) ` +
        `VALUES (${node_id}, '${node.userName}', '${node.secret}', '${node.orgName}', ${node.csrHosts}, ${node.port}, ${node.type});`
    let nodeQuery = ``;
    switch (node.constructor) {
        case CaNode:
            nodeQuery = `INSERT INTO ca_nodes(node_id, admin_name, admin_secret, is_tls) VALUES (${node_id}, ${node.isTls ? null : `\'${node.adminName}\'`}, ${node.isTls ? null :  `\'${node.adminSecret}\'`}, ${node.isTls});`
            break;
        case PeerNode:
            break;
        case OrdererNode:
            nodeQuery = `INSERT INTO orderer_nodes(node_id, admin_name, admin_secret) VALUES (${node_id}, ${node.adminName}, ${node.adminPw});`
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

module.exports = {
    CA_NODES: CA_NODES,
    PEER_NODES: PEER_NODES,
    ORDERER_NODES: ORDERER_NODES,
    dockerNetworkExists: dockerNetworkExists,
    init: async () => {
        try {
            folderPrep();
            await runPostgres();
            await new Promise(r => setTimeout(r, 2000));
            await createTables();
            let nodes = await fetcNodes();
            loadNodeObjects(nodes);
        } catch (e) {
            console.log(e.response.data.message);
            if (e.response.status === 409) {
                await dockerService.removeContainerFromNetwork(config.name);
            }
        }
    },
    writeNode: async (node) => {
        await writeNode(prepareQueries(node));
    }
}

if (require.main === module) {
    console.log('called directly');
    (async () => {
        let nodes = await fetcNodes();
        console.log(nodes);
    })().catch(e => console.log(e.stack)).finally(async () => await db.endPool())
} else {
    console.log('required as a module');
}

