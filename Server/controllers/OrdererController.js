const { OrdererNode, Errors } = require("../../Common/index");

module.exports = {
    async buildOrdererNode(req, res, next) {
        try {
            req.ordererNode = new OrdererNode(req.body.userName, req.body.password,
                req.body.orgName, req.body.port, req.body.csrHosts,
                req.body.adminName, req.body.adminPw);
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR ORDERER CONTROLLER BUILD ORDERER NODE`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async registerAndEnrollAdmin(req, res, next) {
        try {
            let ordererNode = req.ordererNode;
            process.env.FABRIC_CA_CLIENT_HOME = `${ordererNode.BASE_PATH}/fabric-ca/client`;
            process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${ordererNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
            req.installation.runBasicCmd(ordererNode.generateAdminRegisterCommand(req.context.CA_NODES.tlsCaNode));
            req.installation.runBasicCmd(ordererNode.generateAdminEnrollCommand(req.context.CA_NODES.tlsCaNode));
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR ORDERER CONTROLLER ADMIN REGISTER & ENROLL`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async tlsRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.ordererNode,
                req.context.CA_NODES.tlsCaNode);
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR ORDERER CONTROLLER TLS REGISTER & ENROLL`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async orgRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.ordererNode,
                req.context.CA_NODES.orgCaNode);
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR ORDERER CONTROLLER ORG REGISTER & ENROLL`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async startOrderer(req, res, next) {
        try {
            await req.installation.runContainerViaEngineApi(req.ordererNode.generateDockerConfiguration());
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR ORDERER CONTROLLER START ORDERER`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async updateContext(req, res, next) {
        try {
            await req.context.updateContext(req.ordererNode);
            res.send("\nk from postgres");
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR ORDERER CONTROLLER UPDATE CTX`, e);
                next(wrappedError);
            }
            next(e);
        }
    }
}
