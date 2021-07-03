const { CaNode } = require('../../Common/index');
// let installation;
// let context;

module.exports = {
    // set installation (installationRef) {
    //   installation = installationRef;
    // },
    // set context(contextRef) {
    //     context = contextRef;
    // },
    async buildCaNode(req, res, next) {
        try {
            if (!req.body) res.send("The request body is empty")
            // if (caNode.isTls) {
            //     req.context.CA_NODES.tlsCaNode = caNode;
            // } else {
            //     caNode.adminName = req.body.adminName;
            //     caNode.adminSecret = req.body.adminSecret;
            //     req.context.CA_NODES.orgCaNode = caNode;
            // }
            req.caNode = new CaNode(req.body.userName, req.body.password, req.body.port,
                req.body.orgName, req.body.isTls, req.body.csrHosts, req.body.adminName, req.body.adminSecret);
            next();
        } catch (e) {
            res.send("Error building CA node " + e.message)
        }
    },
    async registerAndEnroll(req, res, next) {
        if (req.caNode instanceof CaNode && req.caNode.isTls) {
            await req.context.updateContext(req.caNode);
            next();
        } else {
            try {
                req.installation.registerAndEnroll(req.caNode, req.context.CA_NODES.tlsCaNode);
                next();
            } catch (e) {
                res.send("Error during register & enroll: " + e.message);
            }
        }
    },
    async startContainer(req, res, next) {
        try {
            let caNode = req.caNode;
            req.installation.caInitFolderPrep(caNode);
            await req.installation.runContainerViaEngineApi(caNode.generateDockerConfiguration());
            console.log("[TIME] => Waiting for the ca server to start");
            await new Promise(r => setTimeout(r, 2000));
            console.log("[TIME] => Ca server started");
            next();
        } catch (e) {
            res.send("Error starting container: " + e.message);
            console.trace(e);
        }
    },
    async enroll(req, res, next) {
        try {
            req.installation.caEnroll(req.caNode);
            next();
        } catch (e) {
            res.send(e.stack);
        }
    },
    async createOrgMsp(req, res, next) {
        if (req.caNode.isTls) {
            res.send("ok\n");
        } else {
            req.installation.createMspFolder(req.caNode);
            next();
        }
    },
    async orgAdminRegisterAndEnroll(req, res, next) {
        process.env.FABRIC_CA_CLIENT_HOME =`${req.caNode.BASE_PATH}/fabric-ca/client`;
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES =`${req.caNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
        req.installation.runBasicCmd(req.caNode.generateOrgAdminRegisterCommand());
        req.installation.runBasicCmd(req.caNode.generateOrgAdminEnrollCommand());
        req.installation.runBasicCmd(`cp ${process.env.FABRIC_CFG_PATH}/config.yaml ${req.caNode.BASE_PATH}/fabric-ca/client/org-ca/${req.caNode.adminName}/msp`);
        next();
    },
    async updateContext(req, res) {
        req.caNode.adminName = req.body.adminName;
        req.caNode.adminSecret = req.body.adminSecret;
        await req.context.updateContext(req.caNode);
        res.send("\nk from postgres");
    }
}