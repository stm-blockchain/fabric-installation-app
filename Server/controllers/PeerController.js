const { PeerNode } = require("../../Common/index");

module.exports = {
    async buildPeerNode(req, res, next) {
      try {
          req.peerNode = new PeerNode(req.body.peerName, req.body.password,
              req.body.orgName, req.body.port, `${req.body.csrHosts}`);
          next();
      } catch (e) {
          req.installation.printLog(e);
          res.send("Faulty request body");
      }
    },
    async tlsRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.tlsCaNode);
            next();
        } catch (e) {
            req.installation.printLog(e);
            res.send(`TlsCa register&enroll error: ${e.message}`);
        }
    },
    async orgRegisterEnroll(req, res, next) {
        try {
            req.installation.registerAndEnroll(req.peerNode,
                req.context.CA_NODES.orgCaNode);
            next();
        } catch (e) {
            req.installation.printLog(e);
            res.send(`OrgCa register&enroll error: ${e.message}`);
        }
    },
    async startCouchDB(req, res, next) {
      try {
          await req.installation.runContainerViaEngineApi(req.peerNode.generateCouchDBConfig());
          next();
      } catch (e) {
          req.installation.printLog(e);
          res.send(`Error starting couchDb: ${e.message}`);
      }
    },
    async startPeer(req, res, next) {
        try {
          await req.installation.runContainerViaEngineApi(req.peerNode.generateDockerConfiguration());
          next();
        } catch (e) {
            req.installation.printLog(e);
            res.send(`Error starting container: ${e.message}`);
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
            res.status(500).send(`Error while creating CLI env: \n${e.message}\n${e.stack}`);
        }
    },
    async fetchGenesisBlock(req, res, next) {
        try {
            const blockPath = `${req.peerNode.BASE_PATH}/peers/${req.peerNode.name}/${req.body.channelName}.genesis.block`
            const command = req.installation.generateFetchCommand(req.peerNode, req.body.ordererConfig, req.body.channelName, blockPath);
            req.installation.runBasicCmd(command);
            req.blockPath = blockPath;
            next();
        } catch (e) {
            res.status(500).send(`Error while fetching genesis block: \n${e.message}\n${e.stack}`);
        }
    },
    async joinChannel(req, res) {
        try {
            const command = req.installation.generateJoinCommand(req.blockPath);
            req.installation.runBasicCmd(command);
            res.send(`ok\n`);
        } catch (e) {
            res.status(500).send(`Error while fetching genesis block: \n${e.message}\n${e.stack}`);
        }
    },
    async prepareForCommit(req, res) {
        try {
            const result = await req.installation.prepareForCommit(req.body.chaincodeConfig);
            res.send(`Result for ${req.peerNode.orgName}: ${result[req.peerNode.orgName]}`);
        } catch (e) {
            res.status(500).send(`${e.message}: \n${e.stack}`);
        }
    },
    async commitChaincode(req, res) {
        try {
            const isReadyForCommit = await req.installation.isReadyForCommit(req.body.commitConfig);
            if (!isReadyForCommit) res.status(400).send("All organizations must approve the chaincode\n");
            await req.installation.commitChaincode(req.body.commitConfig);
            res.send("ok\n")
        } catch (e) {
            res.status(500).send(`${e.message}: \n${e.stack}`);
        }
    }
}