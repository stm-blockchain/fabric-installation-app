const { PeerNode, Errors } = require("../../Common/index");

module.exports = {
    async buildPeerNode(req, res, next) {
      try {
          req.peerNode = new PeerNode(req.body.peerName, req.body.password,
              req.body.orgName, req.body.port, `${req.body.csrHosts}`);
          next();
      } catch (e) {
          if (!(e instanceof Errors.BaseError)) {
              const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER BUILD PEER NODE`, e);
              next(wrappedError);
          }
          next(e);
      }
    },
    async tlsRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.tlsCaNode);
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER TLS REGISTER & ENROLL`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async orgRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.orgCaNode);
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER ORG REGISTER & ENROLL`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async startCouchDB(req, res, next) {
      try {
          await req.installation.runContainerViaEngineApi(req.peerNode.generateCouchDBConfig());
          next();
      } catch (e) {
          if (!(e instanceof Errors.BaseError)) {
              const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER START COUCHDB`, e);
              next(wrappedError);
          }
          next(e);
      }
    },
    async startPeer(req, res, next) {
        try {
            await req.installation.runContainerViaEngineApi(req.peerNode.generateDockerConfiguration());
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER START PEER`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async updateContext(req, res, next) {
        try {
            await req.context.updateContext(req.peerNode);
            res.send("\nk from postgres");
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER UPDATE CTX`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async getPeer(req, res, next){
        try {
            const peer = req.context.getPeer(req.body.peerConfig);

            if (!peer) {
                res.status(400).send(`No such peer`);
            }

            req.peerNode = peer;
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER GET PEER`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async setUpCliEnv(req, res, next) {
        try {
            req.installation.createCliEnv(req.peerNode);
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER SET CLI ENV`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async fetchGenesisBlock(req, res, next) {
        try {
            const blockPath = `${req.peerNode.BASE_PATH}/peers/${req.peerNode.name}/${req.body.channelName}.genesis.block`
            await req.installation.fetchGenesisBlock(req.peerNode, req.body.ordererConfig, req.body.channelName, blockPath)
            req.blockPath = blockPath;
            next();
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER FETCH GENESIS`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async joinChannel(req, res, next) {
        try {
            await req.installation.joinChannel(req.blockPath);
            res.send(`ok\n`);
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER JOIN CHANNEL`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async prepareForCommit(req, res, next) {
        try {
            const result = await req.installation.prepareForCommit(req.body.chaincodeConfig);
            res.send(`Result for ${req.peerNode.orgName}: ${result[req.peerNode.orgName]}`);
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER PREPARE COMMIT`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async commitChaincode(req, res, next) {
        try {
            const isReadyForCommit = await req.installation.isReadyForCommit(req.body.commitConfig);
            if (!isReadyForCommit) res.status(400).send("All organizations must approve the chaincode\n");
            await req.installation.commitChaincode(req.body.commitConfig);
            res.send("ok\n")
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER COMMIT`, e);
                next(wrappedError);
            }
            next(e);
        }
    }
}