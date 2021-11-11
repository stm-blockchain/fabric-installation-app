const dockerApi = require('./dockerApi');
const DockerService = new dockerApi();
const childProcess = require("child_process");
const util = require("util");
const exec = util.promisify(childProcess.exec);

const INSPECT_MATERIAL = "context_postgres";
const helloWorldConfig = {
    Name: `Hello_World`,
    Image: "hello-world",
}

async function _checkContainers() {
    try {
        const response = await DockerService.listContainers();
        console.log("List of All Containers: ", response.data);
    } catch (e) {
        console.log("ERROR", e.message);
        if (e.hasOwnProperty('response') && e.response) console.log(e.response);
        else console.log(e);
    }
}

async function _checkImages() {
    try {
        const response = await DockerService.listImages();
        console.log("List of All Images: ", response.data);
    } catch (e) {
        console.log("ERROR", e.message);
        if (e.hasOwnProperty('response') && e.response) console.log(e.response);
        else console.log(e);
    }
}

async function _inspectContainer() {
    try {
        const response = await DockerService.inspectContainer(INSPECT_MATERIAL);
        console.log("Inspection: ", response.data.Config);
    } catch (e) {
        console.log("ERROR", e.message);
        if (e.hasOwnProperty('response') && e.response) console.log(e.response);
        else console.log(e);
    }
}

async function _createHelloWorld() {
    try {
        const response = await DockerService.createContainer(helloWorldConfig);
        return response.data.Id;
    } catch (e) {
        console.log("ERROR", e.message);
        if (e.hasOwnProperty('response') && e.response) console.log(e.response);
        else console.log(e);
    }
}

async function _startHelloWorld(Id) {
    try {
        await DockerService.startContainer(Id);
    } catch (e) {
        console.log("ERROR", e.message);
        if (e.hasOwnProperty('response') && e.response) console.log(e.response);
        else console.log(e);
    }
}

async function _removeHelloWorld() {
    try {
        await DockerService.removeContainer(helloWorldConfig.Name);
        console.log("SUCCESSFULLY REMOVED Hello_World");
    } catch (e) {
        console.log("ERROR", e.message);
        if (e.hasOwnProperty('response') && e.response) console.log(e.response);
        else console.log(e);
    }
}

async function _runHelloWorld() {
    const id = await _createHelloWorld();
    await _startHelloWorld({Id: id});
    const {stdout, stderr} = await exec(`docker logs ${helloWorldConfig.Name} 2>&1`);
    console.log("HELLO_WORLD LOGS", stdout);
    await _removeHelloWorld();
}

async function main() {
    console.log("---------- CONTAINERS ----------");
    await _checkContainers();
    console.log("---------- IMAGES ----------");
    await _checkImages();
    console.log("---------- INSPECT ----------");
    await _inspectContainer();
    console.log("---------- HELLO_WORLD ----------");
    await _runHelloWorld();
}

if (require.main === module) {
    main();
}
