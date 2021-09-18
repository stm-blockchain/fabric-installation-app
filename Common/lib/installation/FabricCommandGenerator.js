const CaNode = require(`../CaNode`);
const PeerNode = require(`../PeerNode`);
const Errors = require(`../error`);

const Commands = {
    OS: {
        TO_STDOUT: "2>&1"
    },
    FABRIC_CA: {
        FABRIC_CA_CLIENT: "fabric-ca-client",
        ENROLL: "enroll",
        REGISTER: "register"
    },
    PEER: {
        FETCH: "peer channel fetch",
        JOIN: "peer channel join",
        LIST: "peer channel list",
        FETCH_OLDEST: "oldest",
        INSTALL: "peer lifecycle chaincode install",
        QUERY_INSTALLED: "peer lifecycle chaincode queryinstalled -O json",
        APPROVE: "peer lifecycle chaincode approveformyorg",
        QUERY_APPROVED: "peer lifecycle chaincode queryapproved --output json",
        CHECK_COMMIT_READINESS: "peer lifecycle chaincode checkcommitreadiness",
        COMMIT: "peer lifecycle chaincode commit",
        QUERY_COMMITTED: "peer lifecycle chaincode querycommitted --output json"
    }
}

module.exports = {
    Commands: Commands,
    generateEnrollCommand(candidateNode, caNode) {
        if (caNode && !(caNode instanceof CaNode)) {
            throw new Errors.CommandGenerationError(`NOT AN INSTANCE OF CaNde`, new Error());
        }
        try {
            let command = [Commands.FABRIC_CA.FABRIC_CA_CLIENT, Commands.FABRIC_CA.ENROLL,
                "-u", `${!caNode ? candidateNode.url : `https://${candidateNode.name}:${candidateNode.secret}@${caNode.host}:${caNode.port}`}`,
                "-M", `${!caNode ? candidateNode.mspDir : `${caNode.isTls ? `tls-ca` : `org-ca`}/${candidateNode.name}/msp`}`,
                "--csr.hosts", candidateNode.csrHosts];

            if ((caNode && caNode.isTls)
                || (candidateNode instanceof CaNode
                    && candidateNode.isTls))
                command = command.concat(["--enrollment.profile", `tls`]);

            command.push(Commands.OS.TO_STDOUT);
            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING ENROLL CMD`, e);
        }
    },
    generateRegisterCommand(candidateNode, caNode) {
        if (!(caNode instanceof CaNode)) {
            throw new Errors.CommandGenerationError(`NOT AN INSTANCE OF CaNde`, new Error());
        }

        try {
            let command = [Commands.FABRIC_CA.FABRIC_CA_CLIENT, Commands.FABRIC_CA.REGISTER,
                `-d`,
                `--id.name ${candidateNode.name}`,
                `--id.secret ${candidateNode.secret}`,
                `--id.type ${candidateNode.nodeType}`,
                "-u", `https://${caNode.host}:${caNode.port}`,
                "-M", caNode.mspDir,
                Commands.OS.TO_STDOUT];

            return command.join(` `);
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING REGISTER CMD`, e);
        }
    },
    // peer channel fetch oldest -o $ORDERER_ADDRESS --cafile $ORDERER_TLS_CA --tls -c testchannel $PWD/Org1/peer1/testchannel.genesis.block
    generateFetchCommand(peerNode, ordererConfig, channelName, blockPath) {
        try {
            let command = [Commands.PEER.FETCH, Commands.PEER.FETCH_OLDEST,
                `-o ${ordererConfig.ordererAddress}`,
                `--cafile ${process.env.HOME}/ttz/orderers/${ordererConfig.ordererOrgName}-tls-ca-cert.pem`,
                `--tls`,
                `-c ${channelName}`,
                `${blockPath}`,
                Commands.OS.TO_STDOUT
            ];

            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING FETCH CMD`, e);
        }
    },
    generateJoinCommand(blockPath) {
        try {
            let command = [Commands.PEER.JOIN, `-b ${blockPath}`, Commands.OS.TO_STDOUT];
            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING JOIN CMD`, e);
        }
    },
    generateInstallCommand(packageName) {
        try {
            const command = [Commands.PEER.INSTALL,
                `${process.env.HOME}/ttz/chaincodes/${packageName}`,
                Commands.OS.TO_STDOUT];
            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING INSTALL CMD`, e);
        }
    },
    generateApproveCommand(chaincodeConfig) {
        try {
            const command = [Commands.PEER.APPROVE,
                `-o ${chaincodeConfig.ordererAddress}`,
                `--channelID ${chaincodeConfig.channelId}`,
                `--name ${chaincodeConfig.ccName}`,
                `--version ${chaincodeConfig.version}`,
                `--package-id ${process.env.CC_PACKAGE_ID}`,
                `--sequence ${chaincodeConfig.seq}`,
                `--tls`,
                `--cafile ${process.env.HOME}/ttz/orderers/${chaincodeConfig.ordererOrgName}-tls-ca-cert.pem`,
                Commands.OS.TO_STDOUT]

            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING APPROVE CMD`, e);
        }
    },
    generateQueryApprovedCommand(channelName, ccName) {
        try {
            const command = [Commands.PEER.QUERY_APPROVED,
                `-C ${channelName}`,
                `-n ${ccName}`,
                Commands.OS.TO_STDOUT
            ];

            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING QUERYAPPROVED CMD`, e);
        }
    },
    generateCommitReadinessCommand(chaincodeConfig) {
        try {
            const command = [Commands.PEER.CHECK_COMMIT_READINESS,
                `--channelID ${chaincodeConfig.channelId}`,
                `--name ${chaincodeConfig.ccName}`,
                `--version ${chaincodeConfig.version}`,
                `--sequence ${chaincodeConfig.seq}`,
                `--tls`,
                `--cafile ${process.env.HOME}/ttz/orderers/${chaincodeConfig.ordererOrgName}-tls-ca-cert.pem`,
                `--output json`,
                Commands.OS.TO_STDOUT];

            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING COMMITREADINESS CMD`, e);
        }
    },
    generateCommitCommand(commitConfig) {
        try {
            const command = [Commands.PEER.COMMIT,
                `-o ${commitConfig.ordererAddress}`,
                `--channelID ${commitConfig.channelId}`,
                `--name ${commitConfig.ccName}`,
                `--version ${commitConfig.version}`,
                `--sequence ${commitConfig.seq}`,
                `--tls`,
                `--cafile ${process.env.HOME}/ttz/orderers/${commitConfig.ordererOrgName}-tls-ca-cert.pem`,
                Commands.OS.TO_STDOUT];

            commitConfig.peers.forEach(peer => {
                let parameter = `--peerAddresses ${peer.peerAddress} --tlsRootCertFiles ${process.env.HOME}/ttz/tlsRootCerts/${peer.orgName}-tls-ca-cert.pem`;
                command.push(parameter);
            });

            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING COMMIT CMD`, e);
        }
    },
    generateQueryCommittedCommand(channelName, ordererConfig) {
        try {
            const command = [Commands.PEER.QUERY_COMMITTED,
                `--channelID ${channelName}`,
                Commands.OS.TO_STDOUT
            ];
            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING QUERYCOMMITTED CMD`, e);
        }
    },
    generateChannelListCommand() {
        try {
            const command = [Commands.PEER.LIST,
                Commands.OS.TO_STDOUT];
            return command.join(" ");
        } catch (e) {
            throw new Errors.CommandGenerationError(`ERROR GENERATING LIST CMD`, e);
        }
    }
}