const { PeerNode, CaNode } = require("../../Common/index")
let installation;

module.exports = {
    set installation(installationRef) {
        installation = installationRef;
    },
    async buildPeerNode(req, res, next) {
      try {
          req.peerNode = new PeerNode(req.body.peerName, req.body.password,
              req.body.orgName, req.body.port, `\"${req.body.csrHosts}\"`);
          next()
      } catch (e) {
          installation.printLog(e)
          res.send("Faulty request body")
      }
    },
    async tlsRegisterEnroll(req, res, next) {
        try {
            installation.registerAndEnroll(req.peerNode,
                new CaNode(`tls-ca-admin`, `tls-ca-adminpw`, `7052`, `Org1`, true));
            next();
        } catch (e) {
            installation.printLog(e)
            res.send(`TlsCa register&enroll error: ${e.message}`);
        }
    },
    async orgRegisterEnroll(req, res, next) {
        try {
            installation.registerAndEnroll(req.peerNode,
                new CaNode(`org-ca-admin`, `org-ca-adminpw`, `7053`, `Org1`, false))
            next()
        } catch (e) {
            installation.printLog(e)
            res.send(`OrgCa register&enroll error: ${e.message}`)
        }
    },
    async startCouchDB(req, res, next) {
      try {
          installation.runBasicCmd(req.peerNode.generateCouchDBCmd());
          next()
      } catch (e) {
          installation.printLog(e)
          res.send(`Error starting couchDb: ${e.message}`)
      }
    },
    async startPeer(req, res) {
        try {
          installation.runContainer(req.peerNode);
          res.send(`ok`)
        } catch (e) {
            installation.printLog(e)
            res.send(`Error starting container: ${e.message}`)
        }
    }
}