const { PeerNode } = require("../../Common/index");

module.exports = {
    async buildPeerNode(req, res, next) {
      try {
          req.peerNode = new PeerNode(req.body.peerName, req.body.password,
              req.body.orgName, req.body.port, `${req.body.csrHosts}`);
          next();
      } catch (e) {
          next(e);
      }
    },
    async tlsRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.tlsCaNode);
            next();
        } catch (e) {
            next(e);
        }
    },
    async orgRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.orgCaNode);
            next();
        } catch (e) {
            next(e);
        }
    },
    async startCouchDB(req, res, next) {
      try {
          await req.installation.runContainerViaEngineApi(req.peerNode.generateCouchDBConfig());
          next();
      } catch (e) {
          next(e);
      }
    },
    async startPeer(req, res, next) {
        try {
          await req.installation.runContainerViaEngineApi(req.peerNode.generateDockerConfiguration());
          next();
        } catch (e) {
            next(e);
        }
    },
    async updateContext(req, res) {
        await req.context.updateContext(req.peerNode);
        res.send("\nk from postgres");
    },
    async getPeer(req, res, next){
        const peer = req.context.getPeer(req.body.peerConfig);

        if (!peer) {
            res.status(400).send(`No such peer`);
        }

        req.peerNode = peer;
        next();
    },
    async setUpCliEnv(req, res, next) {
        try {
            req.installation.createCliEnv(req.peerNode);
            next();
        } catch (e) {
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
            next(e);
        }
    },
    async joinChannel(req, res, next) {
        try {
            await req.installation.joinChannel(req.blockPath);
            res.send(`ok\n`);
        } catch (e) {
            next(e);
        }
    },
    async prepareForCommit(req, res, next) {
        try {
            const result = await req.installation.prepareForCommit(req.body.chaincodeConfig);
            res.send(`Result for ${req.peerNode.orgName}: ${result[req.peerNode.orgName]}`);
        } catch (e) {
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
            next(e);
        }
    }
}