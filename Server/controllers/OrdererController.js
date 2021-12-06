const { OrdererNode, Errors } = require("../../Common/index");

module.exports = {
    async buildOrdererNode(req, res, next) {
        try {
            req.logger.log({level: 'info', message: 'Building OrdererNode'});
            req.ordererNode = new OrdererNode(req.body.userName, req.body.password,
                req.body.orgName, parseInt(req.body.port), req.body.csrHosts,
                req.body.adminName, req.body.adminPw, req.body.externalIp, req.body.internalIp);
            req.ordererNode.logger = req.logger;
            req.ordererNode.folderPrep();
            req.logger.log({level: 'info', message: 'Successfuly built OrdererNode'});
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
            req.logger.log({level: 'info', message: 'OrdererNode Admin TLS register & enroll started'});
            let ordererNode = req.ordererNode;
            process.env.FABRIC_CA_CLIENT_HOME = `${ordererNode.BASE_PATH}/fabric-ca/client`;
            process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${ordererNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
            await req.installation.runBasicCmd(`Register admin`, ordererNode.generateAdminRegisterCommand(req.context.CA_NODES.tlsCaNode));
            await req.installation.runBasicCmd(`Enroll admin`, ordererNode.generateAdminEnrollCommand(req.context.CA_NODES.tlsCaNode));
            req.logger.log({level: 'info', message: 'OrdererNode Admin TLS register & enroll successful'});
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
            req.logger.log({level: 'info', message: 'OrdererNode TLS register & enroll started'});
            await req.installation.registerAndEnroll(req.ordererNode,
                req.context.CA_NODES.tlsCaNode);
            req.logger.log({level: 'info', message: 'OrdererNode TLS register & enroll successful'});
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
            req.logger.log({level: 'info', message: 'OrdererNode Org CA register & enroll started'});
            await req.installation.registerAndEnroll(req.ordererNode,
                req.context.CA_NODES.orgCaNode);
            req.logger.log({level: 'info', message: 'OrdererNode Org CA register & enroll successful'});
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
            req.logger.log({level: 'info', message: 'Starting orderer container'});
            await req.installation.runContainerViaEngineApi(req.ordererNode.generateDockerConfiguration());
            req.logger.log({level: 'info', message: 'Orderer container successfully started'});
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
            req.logger.log({level: 'info', message: 'OrdererNode Update context started'});
            await req.context.updateContext(req.ordererNode);
            req.logger.log({level: 'info', message: 'OrdererNode Update context successful'});
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
