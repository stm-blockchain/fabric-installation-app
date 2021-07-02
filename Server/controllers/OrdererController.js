const { OrdererNode } = require("../../Common/index")
let installation;

module.exports = {
    set installation(installationRef) {
        installation = installationRef;
    },
    async buildOrdererNode(req, res, next) {
        try {
            req.ordererNode = new OrdererNode(req.body.userName, req.body.password,
                req.body.orgName, req.body.port, req.body.csrHosts,
                req.body.adminName, req.body.adminPw);
            next();
        } catch (e) {
            installation.printLog(e);
            res.send("Faulty request body");
        }
    },
    async registerAndEnrollAdmin(req, res, next) {
        try {
            let ordererNode = req.ordererNode;
            process.env.FABRIC_CA_CLIENT_HOME = `${ordererNode.BASE_PATH}/fabric-ca/client`;
            process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${ordererNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
            installation.runBasicCmd(ordererNode.generateAdminRegisterCommand(installation.CA_NODES.tlsCaNode));
            installation.runBasicCmd(ordererNode.generateAdminEnrollCommand(installation.CA_NODES.tlsCaNode));
            next();
        } catch (e) {
            installation.printLog(e);
            res.send("Faulty request body");
        }
    },
    async tlsRegisterEnroll(req, res, next) {
        try {
            installation.registerAndEnroll(req.ordererNode,
                installation.CA_NODES.tlsCaNode);
            next();
        } catch (e) {
            installation.printLog(e);
            res.send(`TlsCa register&enroll error: ${e.message}`);
        }
    },
    async orgRegisterEnroll(req, res, next) {
        try {
            installation.registerAndEnroll(req.ordererNode,
                installation.CA_NODES.orgCaNode);
            next();
        } catch (e) {
            installation.printLog(e);
            res.send(`OrgCa register&enroll error: ${e.message}`);
        }
    },
    async startOrderer(req, res, next) {
        try {
            await installation.runContainerViaEngineApi(req.ordererNode.generateDockerConfiguration());
            next();
        } catch (e) {
            installation.printLog(e);
            res.send(`Error starting container: ${e.message}`);
        }
    }
}
