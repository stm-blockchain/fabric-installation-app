const { CaNode } = require('../../Common/index');
let installation;

module.exports = {
    set installation (installationRef) {
      installation = installationRef;
    },
    async buildCaNode(req, res, next) {
        try {
            if (!req.body) res.send("The request body is empty")
            let caNode = new CaNode(req.body.userName, req.body.password,
                req.body.port, req.body.orgName, req.body.isTls, req.body.csrHosts);
            if (caNode.isTls) {
                installation.CA_NODES.tlsCaNode = caNode;
            } else {
                caNode.adminName = req.body.adminName;
                caNode.adminSecret = req.body.adminSecret;
                installation.CA_NODES.orgCaNode = caNode;
            }
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
    async enroll(req, res, next) {
        try {
            installation.caEnroll(req.caNode)
            next()
        } catch (e) {
            res.send(e.stack)
        }
    },
    async createOrgMsp(req, res, next) {
        if (req.caNode.isTls) {
            res.send("ok\n");
        } else {
            installation.createMspFolder(req.caNode);
            next();
        }
    },
    async orgAdminRegisterAndEnroll(req, res) {
        process.env.FABRIC_CA_CLIENT_HOME =`${req.caNode.BASE_PATH}/fabric-ca/client`;
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES =`${req.caNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
        installation.runBasicCmd(req.caNode.generateOrgAdminRegisterCommand());
        installation.runBasicCmd(req.caNode.generateOrgAdminEnrollCommand());
        installation.runBasicCmd(`cp ${process.env.FABRIC_CFG_PATH}/config.yaml ${req.caNode.BASE_PATH}/fabric-ca/client/org-ca/${req.caNode.adminName}/msp`)
        res.send("ok\n");
    }
}