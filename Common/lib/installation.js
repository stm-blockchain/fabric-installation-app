const childProcess = require("child_process")
const CertificateAuthority = require(`./CaNode`)
const BaseNode = require(`./BaseNode`)
const PeerNode = require(`./PeerNode`)
const fileManager = require("./files");

const Commands = {
    DOCKER_COMPOSE: "docker-compose",
    FABRIC_CA_CLIENT: "fabric-ca-client",
    ENROLL: "enroll",
    REGISTER: "register"
}

module.exports = class Installation {
    CA_NODES = {tlsCaNode: {}, orgCaNode: {yooo:`ld;kf;lasfa`}};

    generateEnrollCommand(candidateNode, caNode) {
        if (caNode && !(caNode instanceof CertificateAuthority)) {
            console.log(`Not an instance`);
            return;
        }
        let command = [Commands.FABRIC_CA_CLIENT, Commands.ENROLL,
            "-u", `${!caNode ? candidateNode.url : `https://${candidateNode.userName}:${candidateNode.password}@${caNode.host}:${caNode.hostPort}`}`,
            "-M", `${!caNode ? candidateNode.mspDir : `${caNode.isTls ? `tls-ca` : `org-ca`}/${candidateNode.userName}/msp`}`,
            "--csr.hosts", candidateNode.csrHosts];

        if ((caNode && caNode.isTls)
            || (candidateNode instanceof CertificateAuthority
                && candidateNode.isTls))
            command = command.concat(["--enrollment.profile", `tls`]);

        return command.join(" ");
    }

    generateRegisterCommand(candidateNode, caNode) {
        if (!(caNode instanceof CertificateAuthority)) {
            console.log(`Not an instance`);
            return;
        }

        let command = [Commands.FABRIC_CA_CLIENT, Commands.REGISTER,
            `-d`,
            `--id.name ${candidateNode.userName}`,
            `--id.secret ${candidateNode.password}`,
            `--id.type ${candidateNode.type}`,
            "-u", `https://${caNode.host}:${caNode.hostPort}`,
            "-M", caNode.mspDir];

        return command.join(` `);
    }

    // docker run --name --network --port --volume --env-file IMAGE COMMAND

    runContainer(node) {
        if (!(node instanceof BaseNode)) {
            console.log(`Not an instance`);
            return;
        }
        let command = `docker run -d --name ${node.containerName} --net ${node.network} -p ${node.hostPort}:${node.hostPort} `
            + `${node.volume} --env-file ${node.generateEnvFile()} ${node.imageName}`
            + ` ${node.serverStartCmd} && sleep 3`

        console.log(command)
        childProcess.execSync(command)
        console.log("done")
    }

    register(candidateNode, caNode) {
        let command = this.generateRegisterCommand(candidateNode, caNode);
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        childProcess.execSync(command);
    }

    registerAndEnroll(candidateNode, caNode) {
        this.register(candidateNode, caNode);
        this.caEnroll(candidateNode, caNode);
        candidateNode.arrangeFolderStructure(caNode);
    }

    caEnroll(candidateNode, caNode) {
        let command = caNode ? this.generateEnrollCommand(candidateNode, caNode)
            : this.generateEnrollCommand(candidateNode);
        childProcess.execSync(`cp ${candidateNode.BASE_PATH}/fabric-ca/server/tls-ca/crypto/ca-cert.pem ${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`)
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        console.log(`ENROLL CMD: ${command}`)
        childProcess.execSync(command)
    }

    initCaServer(node) {
        this.caInitFolderPrep(node)
        if (!node.isTls) {
            this.register(node, this.CA_NODES.tlsCaNode);
        }
        this.runContainer(node)
    }

    caInitFolderPrep(node) {
        let paths = [`${node.BASE_PATH}/fabric-ca/server/tls-ca/crypto/`,
            `${node.BASE_PATH}/fabric-ca/server/org-ca/crypto/`,
            `${node.BASE_PATH}/fabric-ca/server/org-ca/tls/`,
            `${node.BASE_PATH}/fabric-ca/client/org-ca/`,
            `${node.BASE_PATH}/fabric-ca/client/tls-ca/`,
            `${process.env.HOME}/ttz/envFiles`]
            fileManager.mkdir(paths);
    }

    runBasicCmd(cmd) {
        childProcess.execSync(cmd);
    }

    printLog(error) {
        console.log(`ERROR\n${error.message}\n------------------\n${error.stack}`)
    }
}

if (require.main === module) {
    console.log('called directly');
    let testPeer = new PeerNode(`peer1`, `peer1pw`, `Org1`
        , 8053, `\`0.0.0.0,*.Org1.com\``)
    let installation = new Installation();
    let str = installation.generateEnrollCommand(testPeer,
        installation.CA_NODES.tlsCaNode);
    console.log(str)
} else {
    console.log('required as a module');
}


