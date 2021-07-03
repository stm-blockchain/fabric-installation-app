const { PeerNode } = require("../../Common/index")

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
    }
}