const fs = require("fs")
const Errors = require(`./error`);

const BASE = process.env.HOME;

class ManageFile {

    readFile(filePath) {
        try {
            return fs.readFileSync(filePath);
        } catch (e) {
            throw new Errors.FolderStructureError(`READ ERROR`, e);
        }
    }

    createDirectory(parameters) {
        parameters.unshift(BASE)
        let fullPath = parameters.join("/");
        if (fs.existsSync(fullPath)) {
            return;
        }
        fs.mkdirSync(fullPath, {recursive: true});
        console.log(fullPath)
    }

    copyFile(src, dest) {
        try {
            fs.copyFileSync(src, dest)
        } catch (e) {
            throw new Errors.FolderStructureError(`COPY ERROR`, e);
        }
    }

    renameFile(oldName, newName) {
        fs.renameSync(oldName, newName)
    }

    mkdir(pathList) {
        try {
            console.log(pathList)
            pathList.forEach(path => {
                console.log(path)
                if (!fs.existsSync(path)) {
                    console.log("içerdeyim")
                    fs.mkdirSync(path, {recursive: true})
                }
            })
        } catch (e) {
            throw new Errors.FolderStructureError(`MMKDIR ERROR`, e);
        }
    }

    createEnvFile(envList, path) {
        try {
            // if (!fs.existsSync(`${process.env.HOME}/ttz/envFiles`)) fs.mkdirSync(`${process.env.HOME}/ttz/envFiles`, {recursive:true})
            let fileContent = ``;
            envList.forEach(element => {
                fileContent += `${element.name}=${(typeof element.value === `function`) ? element.value() : element.value}\n`
            })
            fs.writeFileSync(path, fileContent);
            console.log(`Env file creation successful`);
        } catch (e) {
            throw new Errors.FolderStructureError(`ENV FILE ERROR`, e);
        }
    }

    getFileNames(folderName) {
        try {
            const path = `${BASE}/ttz/${folderName}`;
            return fs.readdirSync(path);
        } catch (e) {
            throw new Errors.FolderStructureError(`FILE NAMES ERROR`, e);
        }
    }
}

let fileManager;

if (require.main === module) {
    console.log('called directly');
} else {
    fileManager = new ManageFile()
    console.log('required as a module');
}

exports.createDirectory = (...args) => {
    fileManager.createDirectory(args);
}

exports.copyFile = (src, dest) => {
    fileManager.copyFile(src, dest);
}

exports.renameFile = (oldName, newName) => {
    fileManager.renameFile(oldName, newName);
}

exports.createEnvFile = (envList, path)=> {
    fileManager.createEnvFile(envList, path)
}

exports.mkdir = (paths) => {
    fileManager.mkdir(paths)
}

exports.getFileNames = (folderName) => {
    return fileManager.getFileNames(folderName);
}

exports.fileExists = (fullPath) => {
    return fs.existsSync(fullPath);
}

exports.readFile = (filePath) => {
    return fileManager.readFile(filePath);
}