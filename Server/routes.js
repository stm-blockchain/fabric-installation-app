const { Installation } = require('../Common/index');
const installation = new Installation();
const CaController = require('./controllers/CaController')
const PeerController = require(`./controllers/PeerController`)
const OrdererController = require(`./controllers/OrdererController`);

module.exports = (app) => {
    app.post('/initCa',
        (res, req, next) => {
        console.log("içerdeyim")
            CaController.installation = installation
            next()
        },
        CaController.buildCaNode,
        CaController.registerAndEnroll,
        CaController.startContainer,
        CaController.enroll,
        CaController.createOrgMsp,
        CaController.orgAdminRegisterAndEnroll);

    app.post(`/initPeer`,
        (req, res, next) => {
            PeerController.installation = installation;
            next();
        },
        PeerController.buildPeerNode,
        PeerController.tlsRegisterEnroll,
        PeerController.orgRegisterEnroll,
        PeerController.startCouchDB,
        PeerController.startPeer);

    app.post(`/initOrderer`,
        (req, res, next) => {
            OrdererController.installation = installation;
            next()
        },
        OrdererController.buildOrdererNode,
        OrdererController.registerAndEnrollAdmin,
        OrdererController.tlsRegisterEnroll,
        OrdererController.orgRegisterEnroll,
        OrdererController.startOrderer);

}
