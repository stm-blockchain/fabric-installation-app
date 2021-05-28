const fs = require("fs")

const BASE = process.env.HOME;

class ManageFile {

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
        fs.copyFileSync(src, dest)
    }

    renameFile(oldName, newName) {
        fs.renameSync(oldName, newName)
    }

    mkdir(pathList) {
        console.log(pathList)
        pathList.forEach(path => {
            console.log(path)
            if (!fs.existsSync(path)) {
                console.log("içerdeyim")
                fs.mkdirSync(path, {recursive: true})
            }
        })
    }

    createEnvFile(envList, path) {
        // if (!fs.existsSync(`${process.env.HOME}/ttz/envFiles`)) fs.mkdirSync(`${process.env.HOME}/ttz/envFiles`, {recursive:true})
        let fileContent = ``;
        envList.forEach(element => {
            fileContent += `${element.name}=${(typeof element.value === `function`) ? element.value() : element.value}\n`
        })
        fs.writeFileSync(path, fileContent);
        console.log(`Env file creation successful`);
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
