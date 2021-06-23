const { PeerNode } = require("../../Common/index")
let installation;

module.exports = {
    set installation(installationRef) {
        installation = installationRef;
    },
    async buildPeerNode(req, res, next) {
      try {
          req.peerNode = new PeerNode(req.body.peerName, req.body.password,
              req.body.orgName, req.body.port, `${req.body.csrHosts}`);
          next();
      } catch (e) {
          installation.printLog(e);
          res.send("Faulty request body");
      }
    },
    async tlsRegisterEnroll(req, res, next) {
        try {
            installation.registerAndEnroll(req.peerNode,
                installation.CA_NODES.tlsCaNode);
            next();
        } catch (e) {
            installation.printLog(e);
            res.send(`TlsCa register&enroll error: ${e.message}`);
        }
    },
    async orgRegisterEnroll(req, res, next) {
        try {
            installation.registerAndEnroll(req.peerNode,
                installation.CA_NODES.orgCaNode);
            next();
        } catch (e) {
            installation.printLog(e);
            res.send(`OrgCa register&enroll error: ${e.message}`);
        }
    },
    async startCouchDB(req, res, next) {
      try {
          await installation.runContainerViaEngineApi(req.peerNode.generateCouchDBConfig());
          next();
      } catch (e) {
          installation.printLog(e);
          res.send(`Error starting couchDb: ${e.message}`);
      }
    },
    async startPeer(req, res) {
        try {
          await installation.runContainerViaEngineApi(req.peerNode.generateDockerConfiguration());
          res.send(`ok\n`);
        } catch (e) {
            installation.printLog(e);
            res.send(`Error starting container: ${e.message}`);
        }
    }
}