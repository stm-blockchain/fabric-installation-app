const CaController = require('./controllers/CaController')

module.exports = (app) => {
    app.post('/init',
        CaController.init,
        CaController.enroll)

    app.post(`/enroll`,
        CaController.enroll)

    app.post(`/registerTest`,
        CaController.register)
}
