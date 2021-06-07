const CaController = require('./controllers/CaController')
const PeerController = require(`./controllers/PeerController`)
const OrdererController = require(`./controllers/OrdererController`)

module.exports = (app) => {
    app.post('/initCa',
        CaController.buildCaNode,
        CaController.registerAndEnroll,
        CaController.startContainer,
        CaController.enroll)

    app.post(`/initPeer`,
        PeerController.buildPeerNode,
        PeerController.tlsRegisterEnroll,
        PeerController.orgRegisterEnroll,
        PeerController.startCouchDB,
        PeerController.startPeer)

    app.post(`/initOrderer`,
        OrdererController.buildOrdererNode,
        OrdererController.registerAndEnrollAdmin,
        OrdererController.tlsRegisterEnroll,
        OrdererController.orgRegisterEnroll)

    app.post(`/testAdminRegister`,
        OrdererController.buildOrdererNode,
        OrdererController.registerAndEnrollAdmin)
}
