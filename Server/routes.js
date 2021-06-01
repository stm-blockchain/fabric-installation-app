const CaController = require('./controllers/CaController')

module.exports = (app) => {
    app.post('/initCa',
        CaController.buildCaNode,
        CaController.registerAndEnroll,
        CaController.startContainer,
        CaController.enroll)

    app.post(`/enroll`,
        CaController.enroll)

    app.post(`/registerTest`,
        CaController.registerAndEnroll)

    // app.post(`/initTest`,
    //     CaController.init,
    //     CaController.register,
    //     CaController.enroll)
}
