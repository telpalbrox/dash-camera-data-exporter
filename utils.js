const fs = require("fs");
const util = require("util");
const { spawn } = require("child_process");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const stat = util.promisify(fs.stat);

function exec(command, commandArguments, options) {
    return new Promise((resolve, reject) => {
        const spawnCommand = spawn(command, commandArguments, Object.assign({ stdio: [process.stdin, process.stdout, process.stderr ]}, options));

        spawnCommand.on("close", (code) => {
            if (code) {
                reject(new Error(`Command (${command} ${commandArguments.join(" ")}) exited with code ${code}`));
                return;
            }
            resolve(code);
        });
    });
}

async function createDirectoyIfDoesntExisit(path) {
    try {
        await mkdir(path, { recursive: true });
    } catch(err) {
        if (err.type !== "EEXIST") {
            throw err;
        }
    }
}

module.exports = {
    createDirectoyIfDoesntExisit,
    exec,
    readFile,
    writeFile,
    readdir,
    unlink,
    stat
};
