const CaNode = require("../CaNode");
const PeerNode = require("../PeerNode");
const OrdererNode = require("../OrdererNode");
const ContextDao = require(`./ContextDao`);
const db = require("../db");
const dao = new ContextDao(db);

let CA_NODES = {};
let PEER_NODES = [];
let ORDERER_NODES = [];

let logger;

async function _init(logger) {
    _setLogger(logger);
    logger.log({level: `debug`, message: `Creating tables`});
    await dao.createTable();
    logger.log({level: `debug`, message: `Tables created`});
    logger.log({level: `debug`, message: `Fetching nodes`});
    const nodes = await dao.fetchNodes();
    logger.log({level: `debug`, message: `Nodes fetched`});
    _loadNodeObjects(nodes);
}

function _updateContextObject(node) {
    logger.log({level: `debug`, message: `Updating context objects`});
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

function _getPeerByName(peerConfig) {
    logger.log({level: `debug`, message: `Getting peer`});
    const result = PEER_NODES.filter(peer => peer.name === peerConfig.peerName && peer.orgName === peerConfig.orgName);
    return result.length > 0 ? result[0] : null;
}

function _loadNodeObjects(nodes) {
    logger.log({level: `debug`, message: `Loading node objects`});
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

function _setLogger(loggerInstance) {
    logger = loggerInstance;
}

module.exports = {
    init: async (loggerInstance) => _init(loggerInstance),
    getCaNodes: () => {
        return CA_NODES;
    },
    getOrdererNodes: () => {
        return ORDERER_NODES;
    },
    getPeerNodes: () => {
        return PEER_NODES;
    },
    getPeerByName: (peerConfig) => {
        return _getPeerByName(peerConfig);
    },
    updateContext: async (node) => {
        _updateContextObject(node);
        logger.log({level: `debug`, message: `Inserting node`});
        await dao.insertNode(node);
        logger.log({level: `debug`, message: `Node inserted`});
    }
}
