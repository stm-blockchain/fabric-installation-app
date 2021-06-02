const CaController = require('./controllers/CaController')

module.exports = (app) => {
    app.post('/initCa',
        CaController.buildCaNode,
        CaController.registerAndEnroll,
        CaController.startContainer,
        CaController.enroll)

}
