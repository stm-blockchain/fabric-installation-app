const { PeerNode, CaNode, Installation } = require("../../Common/index")
const installation = new Installation();
// let testPeer = new PeerNode(`peer1`, `peer1pw`, `Org1`,
//     8053, `\`0.0.0.0,*.Org1.com\``)

/**
 *  "userName":"tls-ca-admin",
 "password": "tls-ca-adminpw",
 "port":"7052",
 "orgName":"Org1",
 "isTls": true
 * */

// let caNode = new CaNode("tls-ca-admin", "tls-ca-adminpw", "7052",
//     "Org1", true)
// installation.runContainer(testPeer);
// console.log(testPeer.generateCouchDBCmd())
// installation.runBasicCmd(`cp /home/anil/fabric-installation-app/Common/configuration/config.yaml ${testPeer.BASE_PATH}/peers/${testPeer.userName}/msp/config.yaml`)

module.exports = {
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