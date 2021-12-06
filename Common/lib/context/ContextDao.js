const Errors = require(`../error`);
const CaNode = require("../CaNode");
const PeerNode = require("../PeerNode");
const OrdererNode = require("../OrdererNode");
const { v4: uuidv4 } = require('uuid');

const CONTEXT_DB_COMMANDS = {
    Create_Table: {
        Base_Nodes: `CREATE TABLE IF NOT EXISTS base_nodes ( node_id uuid PRIMARY KEY, name VARCHAR(50), secret VARCHAR(50), org_name VARCHAR(50), csr_hosts VARCHAR(50), port INT NOT NULL, type INT NOT NULL, external_ip VARCHAR(50), internal_ip VARCHAR(50));`,
        Orderer_Nodes: `CREATE TABLE IF NOT EXISTS orderer_nodes ( orderer_id uuid PRIMARY KEY, node_id uuid NOT NULL, admin_name VARCHAR(50), admin_secret VARCHAR(50),FOREIGN KEY (node_id) REFERENCES base_nodes (node_id));`,
        Ca_Nodes: `CREATE TABLE IF NOT EXISTS ca_nodes ( ca_id uuid PRIMARY KEY, node_id uuid NOT NULL, admin_name VARCHAR(50), admin_secret VARCHAR(50), is_tls BOOLEAN NOT NULL,FOREIGN KEY (node_id) REFERENCES base_nodes (node_id));`
    },
    Fetch_Data: {
        Orderer_Node: `SELECT * FROM base_nodes INNER JOIN orderer_nodes ON base_nodes.node_id = orderer_nodes.node_id`,
        Ca_Node: `SELECT * FROM base_nodes INNER JOIN ca_nodes ON base_nodes.node_id = ca_nodes.node_id`,
        Peer_Node: `SELECT * FROM base_nodes WHERE base_nodes.type = 2`
    },
    Insert_Data: {
        Base_Node: (node, node_id) => `INSERT INTO base_nodes(node_id, name, secret, org_name, csr_hosts, port, type, external_ip, internal_ip) VALUES (${`\'${node_id}\'`}, '${node.name}', '${node.secret}', '${node.orgName}', ${node.csrHosts}, ${node.port}, ${node.type}, '${node.externalIp}', '${node.internalIp}');`,
        Orderer_Node: (node, node_id, type_id) => `INSERT INTO orderer_nodes(orderer_id, node_id, admin_name, admin_secret) VALUES (${`\'${type_id}\'`}, ${`\'${node_id}\'`}, ${`\'${node.adminName}\'`}, ${`\'${node.adminPw}\'`});`,
        Ca_Node: (node, node_id, type_id) => `INSERT INTO ca_nodes(ca_id, node_id, admin_name, admin_secret, is_tls) VALUES (${`\'${type_id}\'`}, ${`\'${node_id}\'`}, ${node.isTls ? null : `\'${node.adminName}\'`}, ${node.isTls ? null :  `\'${node.adminSecret}\'`}, ${node.isTls});`
    }
}

async function _createTables(db) {
    const client = await db.connect();
    try {
        await client.query(CONTEXT_DB_COMMANDS.Create_Table.Base_Nodes);
        await client.query(CONTEXT_DB_COMMANDS.Create_Table.Orderer_Nodes);
        await client.query(CONTEXT_DB_COMMANDS.Create_Table.Ca_Nodes);
    } catch (e) {
        throw new Errors.ContextObjError(`CREATE TABLE ERROR`, e);
    } finally {
        client.release();
    }
}

async function _fetcNodes(db) {
    let nodes = {};
    let response;
    const client = await db.connect();
    try {
        response = await client.query(CONTEXT_DB_COMMANDS.Fetch_Data.Ca_Node);
        nodes.caNodes = response.rows;
        response = await client.query(CONTEXT_DB_COMMANDS.Fetch_Data.Orderer_Node);
        nodes.ordererNodes = response.rows;
        response = await client.query(CONTEXT_DB_COMMANDS.Fetch_Data.Peer_Node);
        nodes.peerNodes = response.rows;
        return nodes;
    } catch (e) {
        throw new Errors.ContextObjError(`FETCH DATA ERROR`, e);
    } finally {
        client.release();
    }
}

function _prepareQueries(node) {
    let node_id = uuidv4();
    let type_id = uuidv4();
    let baseQuery = CONTEXT_DB_COMMANDS.Insert_Data.Base_Node(node, node_id);
    let nodeQuery = ``;
    switch (node.constructor) {
        case CaNode:
            nodeQuery = CONTEXT_DB_COMMANDS.Insert_Data.Ca_Node(node, node_id, type_id);
            break;
        case OrdererNode:
            nodeQuery = CONTEXT_DB_COMMANDS.Insert_Data.Orderer_Node(node, node_id, type_id);
            break;
    }
    return { baseQuery: baseQuery, nodeQuery: nodeQuery };
}

async function _insertNode(db, queries) {
    const client = await db.connect();
    try {
        await client.query(queries.baseQuery);
        await client.query(queries.nodeQuery);
    } catch (e) {
        throw new Errors.ContextObjError(`ERROR WRITING NODE`, e);
    } finally {
        client.release();
    }
}

module.exports = class ContextDao {
    constructor(db) {
        this.db = db;
    }

    createTable() {
        return _createTables(this.db);
    }

    fetchNodes() {
        return _fetcNodes(this.db);
    }

    insertNode(node) {
        return _insertNode(this.db, _prepareQueries(node))
    }
}