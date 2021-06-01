const childProcess = require("child_process")
const CertificateAuthority = require(`./CaNode`)
const BaseNode = require(`./BaseNode`)
const fileManager = require("./files");

const Commands = {
    DOCKER_COMPOSE: "docker-compose",
    FABRIC_CA_CLIENT: "fabric-ca-client",
    ENROLL: "enroll",
    REGISTER: "register"
}

let ComposeParams = {
    projectName: "-p installation-sample",
    composeFile: "-f ./configuration/docker-compose.yaml",
    subCommandUp: "up",
    subCommandDown: "down",
    subParameter: "-d",
    serviceName: "tlsca.orderingservice.com"
}

let enrollTestParams = {
    username: "org-ca-admin",
    password: "org-ca-adminpw",
    host: "0.0.0.0",
    port: "7052",
    url: function () {
        return "https://" + this.username
            + ":" + this.password
            + "@" + this.host
            + ":" + this.port
    },
    mspDir: "tls-ca/org-ca-admin/msp",
    csrHosts: "\"0.0.0.0,*.Org1.com\"",
    enrollmentProfile: "tls"
}

let enrollOrgCa = new CertificateAuthority("org-ca-admin", "org-ca-adminpw",
    "9000", "Org1", true);

module.exports = class Installation {
    CA_NODES = {tlsCaNode: {}, orgCaNode: {yooo:`ld;kf;lasfa`}};

    generateEnrollCommand(candidateNode, caNode) {
        if (!(candidateNode instanceof CertificateAuthority)) {
            console.log(`Not an instance`);
            return;
        }
        let command = [Commands.FABRIC_CA_CLIENT, Commands.ENROLL,
            "-u", `${!caNode ? candidateNode.url : `https://${candidateNode.userName}:${candidateNode.password}@${caNode}`}`,
            "-M", candidateNode.mspDir,
            "--csr.hosts", candidateNode.csrHosts];

        if (candidateNode.isTls) command = command.concat(["--enrollment.profile", `tls`]);

        return command.join(" ");
    }

    generateRegisterCommand(candidateNode, caNode) {
        if (!(candidateNode instanceof CertificateAuthority)) {
            console.log(`Not an instance`);
            return;
        }

        let command = [Commands.FABRIC_CA_CLIENT, Commands.REGISTER,
            `-d`,
            `--id.name ${candidateNode.userName}`,
            `--id.secret ${candidateNode.password}`,
            `--id.type ${candidateNode.type}`,
            "-u", caNode.url,
            "-M", caNode.mspDir];

        return command.join(` `);
    }

    // docker run --name --network --port --volume --env-file IMAGE COMMAND

    runContainer(node) {
        if (!(node instanceof BaseNode)) {
            console.log(`Not an instance`);
            return;
        }
        let command = `docker run -d --name ${node.containerName} --net ${node.network} -p ${node.port} `
            + `--volume ${node.volume} --env-file ${node.generateEnvFile()} ${node.imageName}`
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
        /**
         mv $PWD/orderingservice/client/tls-ca/orgadmin/msp/keystore/*_sk $PWD/orderingservice/client/tls-ca/orgadmin/msp/keystore/key.pem
         cp $PWD/orderingservice/client/tls-ca/orgadmin/msp/signcerts/cert.pem $PWD/orderingservice/server/org-ca/tls/
         cp $PWD/orderingservice/client/tls-ca/orgadmin/msp/keystore/key.pem $PWD/orderingservice/server/org-ca/tls/
         */
        // let mspPath = `${candidateNode.BASE_PATH}/fabric-ca/client/${candidateNode.isTls ? `tls-ca` : `org-ca`}/${candidateNode.userName}/msp`;
        // childProcess.execSync(`mv ${mspPath}/keystore/*_sk ${mspPath}/keystore/key.pem`);
        // childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${}`);
        // childProcess.execSync(`mv ${mspPath}/keystore/*_sk ${mspPath}/keystore/key.pem`);
    }

    registerAndEnroll(candidateNode, caNode) {
        this.register(candidateNode, caNode);
        this.caEnroll(candidateNode, caNode);
        candidateNode.arrangeFolderStructure();
    }

    caEnroll(candidateNode, caNode) {
        let command = caNode ? this.generateEnrollCommand(candidateNode, `${caNode.host}:${caNode.hostPort}`)
            : this.generateEnrollCommand(candidateNode);
        childProcess.execSync(`cp ${candidateNode.BASE_PATH}/fabric-ca/server/tls-ca/crypto/ca-cert.pem ${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`)
        process.env.FABRIC_CA_CLIENT_HOME = `${candidateNode.BASE_PATH}/fabric-ca/client`
        process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = `${candidateNode.BASE_PATH}/fabric-ca/client/tls-ca-cert.pem`
        console.log(`ENROLL CMD: ${command}`)
        childProcess.execSync(command)
        // let baseKeyPath = `${candidateNode.BASE_PATH}/fabric-ca/client/${candidateNode.isTls ? `tls-ca` : `org-ca`}/${candidateNode.userName}/msp/keystore`;
        // childProcess.execSync(`mv ${baseKeyPath}/*_sk ${baseKeyPath}/key.pem`)
        // if (node instanceof CertificateAuthority && !node.isTls) {
        //     /**
        //      * cp $PWD/orderingservice/client/tls-ca/orgadmin/msp/signcerts/cert.pem $PWD/orderingservice/server/org-ca/tls/
        //      * cp $PWD/orderingservice/client/tls-ca/orgadmin/msp/keystore/key.pem $PWD/orderingservice/server/org-ca/tls/
        //      */
        //     let mspPath = `${node.BASE_PATH}/fabric-ca/client/${node.isTls ? `tls-ca` : `org-ca`}/${node.userName}/msp`;
        //     childProcess.execSync(`cp ${mspPath}/signcerts/cert.pem ${node.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
        //     childProcess.execSync(`cp ${mspPath}/keystore/key.pem ${node.BASE_PATH}/fabric-ca/server/org-ca/tls/`)
        // }
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
}

if (require.main === module) {
    console.log('called directly');
    let installation = new Installation();
    // installation.generateEnrollCommand(enrollOrgCa)
} else {
    console.log('required as a module');
}


