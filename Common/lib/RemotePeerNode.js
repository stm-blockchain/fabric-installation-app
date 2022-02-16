const PeerNode = require('./PeerNode');
const BaseNode = require(`./BaseNode`);
const fileManager = require(`./files`);
const childProcess = require(`child_process`);
const Errors = require(`./error`);

const REMOTE_INDICATOR = 'remote-peer';

module.exports = class RemotePeerNode extends PeerNode {
    constructor(peerName, orgName, host, port) {
        super(peerName, REMOTE_INDICATOR, orgName, port, REMOTE_INDICATOR, REMOTE_INDICATOR, REMOTE_INDICATOR, {
            host: `${REMOTE_INDICATOR}.com.couchdb`,
            port: `1111`,
            username: `${REMOTE_INDICATOR}`,
            password: `${REMOTE_INDICATOR}`
        });

        this.host = host;
    }

    folderPrep() {
        try {
            this._logger.log({level: `debug`, message: `RemotePeerNode preparing folders`});
            let paths = [`${this.BASE_PATH}/peers/remote/${this.name}`]
            fileManager.mkdir(paths);
            this._logger.log({level: `debug`, message: `PeerNode preparing folders successful`});
        } catch (e) {
            throw new Errors.FolderStructureError(`PEER FODLER PREP EERROR`, e);
        }
    }
}

module.exports.REMOTE_INDICATOR = REMOTE_INDICATOR;