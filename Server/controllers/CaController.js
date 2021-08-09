const { CaNode, Errors } = require('../../Common/index');

module.exports = {
    async buildCaNode(req, res, next) {
        try {
            req.logger.log({level: 'info', message: 'Building CaNode'});
            req.caNode = new CaNode(req.body.userName, req.body.password, req.body.port,
                req.body.orgName, req.body.isTls, req.body.csrHosts, req.body.adminName, req.body.adminSecret);
            req.caNode.logger = req.logger;
            req.logger.log({level: 'info', message: 'Successfuly built CaNode'});
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR CA CONTROLLER BUILD CA NODE`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async registerAndEnroll(req, res, next) {
        req.logger.log({level: 'info', message: 'CaNode register & enroll started'});
        if (req.caNode instanceof CaNode && req.caNode.isTls) {
            req.logger.log({level: 'info', message: 'This is the TLS node itself, updating context'});
            await req.context.updateContext(req.caNode);
            req.logger.log({level: 'info', message: 'Context updated successfuly'});
            next();
        } else {
            try {
                req.logger.log({level: 'info', message: 'Org CA register & enroll to TLS node started'});
                await req.installation.registerAndEnroll(req.caNode, req.context.CA_NODES.tlsCaNode);
                req.logger.log({level: 'info', message: 'Org CA register & enroll to TLS node successful'});
                next();
            } catch (e) {
                if (!(e instanceof Errors.BaseError)) {
                    const wrappedError = new Errors.GenericError(`ERROR CA CONTROLLER REGISTER & ENROLL`, e);
                    next(wrappedError);
                }
                next(e);
            }
        }
    },
    async startContainer(req, res, next) {
        try {
            req.logger.log({level: 'info', message: 'Starting CaNode container'});
            let caNode = req.caNode;
            req.installation.caInitFolderPrep(caNode);
            await req.installation.runContainerViaEngineApi(caNode.generateDockerConfiguration());
            req.logger.log({level: 'debug', message: 'Waiting for the ca server to start'});
            await new Promise(r => setTimeout(r, 4000));
            req.logger.log({level: 'debug', message: 'Ca server started'});
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR CA CONTROLLER START CONTAINER`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async enroll(req, res, next) {
        try {
            req.logger.log({level: 'info', message: 'CaNode enroll started'});
            await req.installation.caEnroll(req.caNode);
            req.logger.log({level: 'info', message: 'CaNode enroll successful'});
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR CA CONTROLLER ENROLL`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async createOrgMsp(req, res, next) {
        req.logger.log({level: 'info', message: 'Creating Org Msp'});
        if (req.caNode.isTls) {
            req.logger.log({level: 'info', message: 'This is a TLS node, moving forward'});
            res.send("ok\n");
        } else {
            try {
                req.installation.createMspFolder(req.caNode);
                req.logger.log({level: 'info', message: 'Creating Org Msp successful'});
                next();
            } catch (e) {
                if (!(e instanceof Errors.BaseError)) {
                    const wrappedError = new Errors.GenericError(`ERROR CA CONTROLLER CREATE ORG MSP`, e);
                    next(wrappedError);
                }
                next(e);
            }
        }
    },
    async orgAdminRegisterAndEnroll(req, res, next) {
        try {
            req.logger.log({level: 'info', message: 'Org Admin register & enroll started'});
            process.env.FABRIC_CA_CLIENT_HOME =`${req.caNode.BASE_PATH}/fabric-ca/client`;
            process.env.FABRIC_CA_CLIENT_TLS_CERTFILES =`${req.caNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`;
            await req.installation.runBasicCmd(`Register org admin`, req.caNode.generateOrgAdminRegisterCommand());
            await req.installation.runBasicCmd(`Enroll org admin`, req.caNode.generateOrgAdminEnrollCommand());
            await req.installation.runBasicCmd(`Copy config`, `cp ${process.env.FABRIC_CFG_PATH}/config.yaml ${req.caNode.BASE_PATH}/fabric-ca/client/org-ca/${req.caNode.adminName}/msp`);
            req.logger.log({level: 'info', message: 'Org Admin register & enroll successful'});
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR CA CONTROLLER ORG ADMIN REGISTER`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async updateContext(req, res, next) {
        try {
            req.logger.log({level: 'info', message: 'Update context started'});
            req.caNode.adminName = req.body.adminName;
            req.caNode.adminSecret = req.body.adminSecret;
            await req.context.updateContext(req.caNode);
            req.logger.log({level: 'info', message: 'Update context successful'});
            res.send("\nk from postgres");
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR CA CONTROLLER UPDATE CTX`, e);
                next(wrappedError);
            }
            next(e);
        }
    }
}