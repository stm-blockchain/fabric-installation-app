const BaseNode = require(`BaseNode`)

module.export = class PeerNode extends BaseNode {
    constructor(peerName, orgName, port) {
        super();
        this.ENV_FILE = {
            CORE_PEER_ID: {
              name: `CORE_PEER_ID`,
              value: `${peerName}.${orgName}.com`
            },
            CORE_PEER_ADDRESS: {
              name: `CORE_PEER_ADDRESS`,
              value: `${peerName}.${orgName}.com:${port}`
            },
            CORE_PEER_LOCALMSPID: {
                name: `CORE_PEER_LOCALMSPID`,
                value: `${orgName}`
            },
            CORE_PEER_LISTENADDRESS: {
              name: `CORE_PEER_LISTENADDRESS`,
              value: `0.0.0.0:${port}`
            },
            CORE_PEER_CHAINCODELISTENADDRESS: {
              name: `CORE_PEER_CHAINCODELISTENADDRESS`,
              value: `0.0.0.0:${port + 1}`
            },
            CORE_PEER_MSPCONFIGPATH: {
              name: `CORE_PEER_MSPCONFIGPATH`,
              value: `/tmp/hyperledger/${orgName}/${peerName}/localMsp`
            },
            CORE_VM_ENDPOINT: {
                name: `CORE_VM_ENDPOINT`,
                value: `unix:///host/var/run/docker.sock`},
            CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE: {
                name: `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE`,
                value: `${this.getNetwork}`
            },
            FABRIC_LOGGING_SPEC: {
                name: `FABRIC_LOGGING_SPEC`,
                value: `info`
            },
            CORE_PEER_TLS_ENABLED: {
                name: `CORE_PEER_TLS_ENABLED`,
                value: `true`
            },
            CORE_PEER_TLS_CERT_FILE: {
                name: `CORE_PEER_TLS_CERT_FILE`,
                value: `/tmp/hyperledger/${orgName}/${peerName}/tls/${orgName}-${peerName}-tls-cert.pem`
            },
            CORE_PEER_TLS_KEY_FILE: {
                name: `CORE_PEER_TLS_KEY_FILE`,
                value: `/tmp/hyperledger/${orgName}/${peerName}/tls/${orgName}-${peerName}-tls-key.pem`
            },
            CORE_PEER_TLS_ROOTCERT_FILE: {
                name: `CORE_PEER_TLS_ROOTCERT_FILE`,
                value: `/tmp/hyperledger/${orgName}/${peerName}/tls/tls-ca-cert.pem`
            },
            CORE_PEER_GOSSIP_USELEADERELECTION: {
                name: `CORE_PEER_GOSSIP_USELEADERELECTION`,
                value: `false`
            },
            CORE_PEER_GOSSIP_ORGLEADER: {
                name: `CORE_PEER_GOSSIP_ORGLEADER`,
                value: `true`
            },
            CORE_PEER_GOSSIP_BOOTSTRAP: {
                name: `CORE_PEER_GOSSIP_BOOTSTRAP`,
                value: `${peerName}.${orgName}.com:${port}`
            },
            CORE_PEER_GOSSIP_EXTERNALENDPOINT: {
                name: `CORE_PEER_GOSSIP_EXTERNALENDPOINT`,
                value: `${peerName}.${orgName}.com:${port}`
            },
            CORE_LEDGER_STATE_STATEDATABASE: {
                name: `CORE_LEDGER_STATE_STATEDATABASE`,
                value: `CouchDB`
            },
            CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS: {
                name: `CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS`,
                value: `${peerName}.${orgName}.com.couchdb:${port}`
            },
            CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME: {
                name: `CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME`,
                value: `dbadmin`
            },
            CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD: {
                name:`CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD`,
                value: `dbadminpw`
            }
        }
    }
}