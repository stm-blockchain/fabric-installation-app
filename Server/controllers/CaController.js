const { CaNode, Installation } = require('../../Common/index');
const installation = new Installation();

module.exports = {
    async buildCaNode(req, res, next) {
        try {
            if (!req.body) res.send("The request body is empty")
            let caNode = new CaNode(req.body.userName, req.body.password,
                req.body.port, req.body.orgName, req.body.isTls);
            caNode.isTls ? installation.CA_NODES.tlsCaNode = caNode
                : installation.CA_NODES.orgCaNode = caNode;
            req.caNode = caNode;
            next();
        } catch (e) {
            res.send("Error building CA node " + e.message)
        }
    },
    async registerAndEnroll(req, res, next) {
        if (req.caNode instanceof CaNode && req.caNode.isTls) {
            next();
        } else {
            try {
                installation.registerAndEnroll(req.caNode, installation.CA_NODES.tlsCaNode)
                next()
            } catch (e) {
                res.send("Error during register & enroll: " + e.message);
            }
        }
    },
    async startContainer(req, res, next) {
        try {
            let caNode = req.caNode;
            installation.caInitFolderPrep(caNode);
            installation.runContainer(caNode);
            next();
        } catch (e) {
            res.send("Error starting container: " + e.message);
        }
    },
    async enroll(req, res) {
        try {
            installation.caEnroll(req.caNode)
            res.send(`ok`)
        } catch (e) {
            res.send(e.stack)
        }
    }
}