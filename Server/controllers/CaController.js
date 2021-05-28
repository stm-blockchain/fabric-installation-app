const { CaNode, Installation } = require('../../Common/index');
const installation = new Installation();

module.exports = {
    async init(req, res, next) {
        if (!req.body) res.send("The request body is empty")
        let caNode = new CaNode(req.body.userName, req.body.password,
            req.body.port, req.body.orgName, req.body.isTls)
        try {
            installation.caInitFolderPrep(caNode);
            installation.runContainer(caNode)
            caNode.isTls ? installation.CA_NODES.tlsCaNode = caNode
                : installation.CA_NODES.orgCaNode = caNode;
            req.caNode = caNode
            next()
        } catch(error){
            console.log(error)
            res.send(error.message)
        }
    },
    async register(req, res, next) {
        if (req.caNode instanceof CaNode && req.caNode.isTls) {
            next();
        } else {
            installation.register(req.caNode, installation.CA_NODES.tlsCaNode)
        }
    },
    async enroll(req, res) {
        try {
            installation.caEnroll(req.caNode)
            res.send(`ok`)
        } catch (e) {
            res.send(e.message)
        }
    }
}