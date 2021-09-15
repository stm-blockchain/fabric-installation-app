const { PeerNode, Errors } = require("../../Common/index");

module.exports = {
    async buildPeerNode(req, res, next) {
      try {
          req.logger.log({level: 'info', message: 'Building PeerNode'});
          req.peerNode = new PeerNode(req.body.peerName, req.body.password,
              req.body.orgName, parseInt(req.body.port), `${req.body.csrHosts}`);
          req.peerNode.logger = req.logger;
          req.peerNode.folderPrep();
          req.logger.log({level: 'info', message: 'Successfully built PeerNode'});
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
            req.logger.log({level: 'info', message: 'PeerNode TLS register & enroll started'});
            await req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.tlsCaNode);
            req.logger.log({level: 'info', message: 'PeerNode TLS register & enroll successful'});
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
            req.logger.log({level: 'info', message: 'Org CA register & enroll started'});
            await req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.orgCaNode);
            req.logger.log({level: 'info', message: 'Org CA register & enroll succcessful'});
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
          req.logger.log({level: 'info', message: 'Starting CouchDB container'});
          await req.installation.runContainerViaEngineApi(req.peerNode.generateCouchDBConfig());
          req.logger.log({level: 'info', message: 'CouchDB container successfully started'});
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
            req.logger.log({level: 'info', message: 'Starting peer container'});
            await req.installation.runContainerViaEngineApi(req.peerNode.generateDockerConfiguration());
            req.logger.log({level: 'info', message: 'Peer container successfully started'});
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
            req.logger.log({level: 'info', message: 'PeerNode update context started'});
            await req.context.updateContext(req.peerNode);
            req.logger.log({level: 'info', message: 'PeerNode update context successful'});
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
            req.logger.log({level: 'info', message: 'Getting peer'});
            const peer = req.context.getPeer(req.body.peerConfig);

            if (!peer) {
                req.logger.log({level: 'info', message: 'No such peer'});
                const wrappedError = new Errors.GenericError(`ERROR NO SUCH PEER`, new Error());
                return next(wrappedError);
            }

            req.peerNode = peer;
            req.logger.log({level: 'info', message: 'Getting peer successful'});
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
            req.logger.log({level: 'info', message: 'Setting up CLI env'});
            req.installation.createCliEnv(req.peerNode);
            req.logger.log({level: 'info', message: 'CLI env set successfully'});
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
            req.logger.log({level: 'info', message: 'Fetching genesis block'});
            const blockPath = `${req.peerNode.BASE_PATH}/peers/${req.peerNode.name}/${req.body.channelName}.genesis.block`
            await req.installation.fetchGenesisBlock(req.peerNode, req.body.ordererConfig, req.body.channelName, blockPath)
            req.blockPath = blockPath;
            req.logger.log({level: 'info', message: 'Genesis block fetched successfully'});
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
            req.logger.log({level: 'info', message: `Joining channel: ${req.body.channelName}`});
            await req.installation.joinChannel(req.blockPath);
            req.logger.log({level: 'info', message: `Successfully joined channel: ${req.body.channelName}`});
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
            req.logger.log({level: 'info', message: `Preparing for commit`});
            const result = await req.installation.prepareForCommit(req.body.chaincodeConfig);
            req.logger.log({level: 'info', message: `Preparation status: ${result[req.peerNode.orgName]}`});
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
            req.logger.log({level: 'info', message: `Commiting chaincode: ${req.body.commitConfig} to channel: ${req.body.channelId}`});
            const isReadyForCommit = await req.installation.isReadyForCommit(req.body.commitConfig);
            if (!isReadyForCommit) {
                req.logger.log({level: 'info', message: `All organizations must approve the chaincode: ${req.body.commitConfig}`});
                res.status(400).send("All organizations must approve the chaincode\n");
            }
            await req.installation.commitChaincode(req.body.commitConfig);
            req.logger.log({level: 'info', message: `Chaincode: ${req.body.commitConfig} successfully commited to channel: ${req.body.channelId}`});
            res.send("ok\n")
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR PEER CONTROLLER COMMIT`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async getPeers(req, res, next) {
        try {
            const peers = req.context.PEER_NODES;
            const body = []
            peers.forEach(i => {
                body.push({
                    peerName: i.name,
                    password: i.secret,
                    orgName: i.orgName,
                    port: i.port,
                    csrHosts: i.csrHosts
                })
            });
            res.send(body);
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR GET PEERS`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async getChannels(req, res, next) {
        try {
            const channels = await req.installation.getChannels();
            const responseBody = [];
            channels.forEach(i => {
                responseBody.push({label: i})
            });
            res.send(responseBody);
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR GET CHANNELS`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async getChaincodePackageNames(req, res, next) {
        try {
            const result = await req.installation.getChaincodePackageNames();
            return res.send(result);
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR GET CHAINCODE PACKAGE NAMES`, e);
                next(wrappedError);
            }
            next(e);
        }
    },
    async queryApprovedChaincodes(req, res, next) {
        try {
            const result = await req.installation.queryApprovedChaincodeNames(req.body.channelName, req.body.ccName);
            res.send({sequence: result.sequence, version: result.version});
        } catch (e) {
            if (!(e instanceof Errors.BaseError)) {
                const wrappedError = new Errors.GenericError(`ERROR QUERYAPPROVED CHAINCODES`, e);
                next(wrappedError);
            }
            next(e);
        }
    }
}