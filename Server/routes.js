const { Installation } = require('../Common/index');
const installation = new Installation();
const CaController = require('./controllers/CaController')
const PeerController = require(`./controllers/PeerController`)
const OrdererController = require(`./controllers/OrdererController`);

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
        (req, res, next) => {
            PeerController.installation = installation;
            next();
        },
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
        async (req, res) => {
            await context.writeNode(req.ordererNode);
            res.send("\nok");
        });

    app.post(`/joinChannel`,
        PeerController.getPeer,
        PeerController.setUpCliEnv,
        PeerController.fetchGenesisBlock,
        PeerController.joinChannel)
}
