// This file is small walk through about the steps to be taken during setup process

const common = require("./index")
const fileManager = require("./lib/files")

let commandDown = [common.Commands.DOCKER_COMPOSE,
    common.ComposeParams.composeFile,
    common.ComposeParams.projectName,
    common.ComposeParams.subCommandDown].join(" ")
let commandUp = [common.Commands.DOCKER_COMPOSE, common.ComposeParams.composeFile,
    common.ComposeParams.projectName, common.ComposeParams.subCommandUp,
    common.ComposeParams.subParameter, common.ComposeParams.serviceName].join(" ");

let enrollTlsCaParams = {
    username: "tls-ca-admin",
    password: "tls-ca-adminpw",
    host: "0.0.0.0",
    port: "7052",
    url: function () {
        return "https://" + this.username
            + ":" + this.password
            + "@" + this.host
            + ":" + this.port
    },
    mspDir: "tls-ca/admin/msp",
    csrHosts: "\"0.0.0.0,*.Org1.com\"",
    enrollmentProfile: "tls"
}

let registerOrgCaParams = {
    id: {
        name: "org-ca-admin",
        secret: "org-ca-adminpw",
        type: "admin"
    },
    url: "https://0.0.0.0:7052",
    mspDir: "tls-ca/admin/msp"
}

let enrollOrgCaParams = {
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

let commandEnrollTlsCaAdmin = [common.Commands.FABRIC_CA_CLIENT, common.Commands.ENROLL,
    "-u", enrollTlsCaParams.url(),
    "-M", enrollTlsCaParams.mspDir,
    "--csr.hosts", enrollTlsCaParams.csrHosts,
    "--enrollment.profile", enrollTlsCaParams.enrollmentProfile].join(" ");

let commandRegisterOrgCaAdmin = [common.Commands.FABRIC_CA_CLIENT, common.Commands.REGISTER, "-d",
    "--id.name", registerOrgCaParams.id.name,
    "--id.secret", registerOrgCaParams.id.secret,
    "--id.type", registerOrgCaParams.id.type,
    "-u", registerOrgCaParams.url,
    "-M", registerOrgCaParams.mspDir].join(" ");

let commandEnrollOrgCaAdmin = [common.Commands.FABRIC_CA_CLIENT, common.Commands.ENROLL,
    "-u", enrollOrgCaParams.url(),
    "-M", enrollOrgCaParams.mspDir,
    "--csr.hosts", enrollOrgCaParams.csrHosts,
    "--enrollment.profile", enrollOrgCaParams.enrollmentProfile].join(" ");
// fabric-ca-client enroll -u https://org-ca-admin:org-ca-adminpw@0.0.0.0:7053 -M org-ca/admin/msp --csr.hosts '0.0.0.0,*.orderingservice.com,192.168.1.38'

let enrollBootstrappedOrgCaAdminParams = {
    username: "org-ca-admin",
    password: "org-ca-adminpw",
    host: "0.0.0.0",
    port: "7053",
    url: function () {
        return "https://" + this.username
            + ":" + this.password
            + "@" + this.host
            + ":" + this.port
    },
    mspDir: "org-ca/admin/msp",
    csrHosts: "\"0.0.0.0,*.Org1.com\"",
}

let commandBootstrappedOrgCaEnroll = [common.Commands.FABRIC_CA_CLIENT, common.Commands.ENROLL,
    "-u", enrollBootstrappedOrgCaAdminParams.url(),
    "-M", enrollBootstrappedOrgCaAdminParams.mspDir,
    "--csr.hosts", enrollBootstrappedOrgCaAdminParams.csrHosts].join(" ")

let commandSleep = "sleep 5"

setUpOrgCaTLS = function () {
    let basePath = process.env.HOME + "/ttz/Org1/fabric-ca/client/tls-ca/org-ca-admin/msp/";
    common.runCommand("mv " + basePath + "keystore/*_sk " + basePath + "keystore/key.pem");
    fileManager.copyFile(basePath + "signcerts/cert.pem", process.env.HOME + "/ttz/Org1/fabric-ca/server/org-ca/tls/cert.pem")
    fileManager.copyFile(basePath + "keystore/key.pem", process.env.HOME + "/ttz/Org1/fabric-ca/server/org-ca/tls/key.pem")
}

startDockerContainer = (composeServiceName) => {
    console.log(`--- Starting ${composeServiceName} ---`)
    let command = [common.Commands.DOCKER_COMPOSE, common.ComposeParams.composeFile,
        common.ComposeParams.projectName, common.ComposeParams.subCommandUp,
        common.ComposeParams.subParameter];
    command.push(composeServiceName);
    common.runCommand(command.join(" "));
    common.runCommand(commandSleep);
}

console.log("--- Creating Folder Structure ---")
// Client
fileManager.createDirectory("ttz", "Org1", "fabric-ca", "client", "tls-ca")
fileManager.createDirectory("ttz", "Org1", "fabric-ca", "client", "org-ca")
// Server
fileManager.createDirectory("ttz", "Org1", "fabric-ca", "server", "org-ca", "crypto")
fileManager.createDirectory("ttz", "Org1", "fabric-ca", "server", "org-ca", "tls")
fileManager.createDirectory("ttz", "Org1", "fabric-ca", "server", "tls-ca", "crypto")

console.log("--- Starting TLS-CA ---")
console.log("Command:", commandUp)
common.runCommand(commandUp)
common.runCommand(commandSleep)

console.log("--- Copying root tls cert ---")
fileManager.copyFile("/home/anil/ttz/Org1/fabric-ca/server/tls-ca/crypto/ca-cert.pem", "/home/anil/ttz/Org1/fabric-ca/client/tls-ca-cert.pem")

process.env.FABRIC_CA_CLIENT_HOME = process.env.HOME + "/ttz/Org1/fabric-ca/client"
process.env.FABRIC_CA_CLIENT_TLS_CERTFILES = process.env.HOME + "/ttz/Org1/fabric-ca/client/tls-ca-cert.pem"

console.log("--- Enrolling TLS Admin ---")
common.runCommand(commandEnrollTlsCaAdmin)

console.log("--- Registering Org CA Admin ---")
common.runCommand(commandRegisterOrgCaAdmin)

console.log("--- Enrolling Org Admin ---")
common.runCommand(commandEnrollOrgCaAdmin)

console.log("--- Setting Up Org CA TLS files ---")
setUpOrgCaTLS();

startDockerContainer("orgca.orderingservice.com")

console.log("--- Enrolling Org CA Bootstrapped Admin ---")
common.runCommand(commandBootstrappedOrgCaEnroll)