const { Installation } = require('../Common/index');
const CaController = require('./controllers/CaController')
const PeerController = require(`./controllers/PeerController`)
const OrdererController = require(`./controllers/OrdererController`);
const ErrorHandler = require(`./controllers/ErrorHandler`);

module.exports = (app, context) => {
    app.post('/initCa',
        CaController.buildCaNode,
        CaController.registerAndEnroll,
        CaController.startContainer,
        CaController.enroll,
        CaController.createOrgMsp,
        CaController.orgAdminRegisterAndEnroll,
        CaController.updateContext);

    app.post(`/initPeer`,
        PeerController.buildPeerNode,
        PeerController.tlsRegisterEnroll,
        PeerController.orgRegisterEnroll,
        PeerController.startCouchDB,
        PeerController.startPeer,
        PeerController.updateContext);

    app.post(`/initOrderer`,
        OrdererController.buildOrdererNode,
        OrdererController.registerAndEnrollAdmin,
        OrdererController.tlsRegisterEnroll,
        OrdererController.orgRegisterEnroll,
        OrdererController.startOrderer,
        OrdererController.updateContext);

    app.get('/initClient',
        CaController.initClient)

    app.get('/peers',
        PeerController.getPeers)

    app.post('/channels',
        PeerController.getPeer,
        PeerController.setUpCliEnv,
        PeerController.getChannels)

    app.post('/ccStates',
        PeerController.getPeer,
        PeerController.setUpCliEnv,
        PeerController.ccStates)

    app.get('/packages',
        PeerController.getChaincodePackageNames)

    app.post(`/joinChannel`,
        PeerController.getPeer,
        PeerController.setUpCliEnv,
        PeerController.fetchGenesisBlock,
        PeerController.joinChannel)

    app.post(`/prepareCommit`,
        PeerController.getPeer,
        PeerController.setUpCliEnv,
        PeerController.prepareForCommit)

    app.post(`/commitChaincode`,
        PeerController.getPeer,
        PeerController.setUpCliEnv,
        PeerController.commitChaincode)
}
