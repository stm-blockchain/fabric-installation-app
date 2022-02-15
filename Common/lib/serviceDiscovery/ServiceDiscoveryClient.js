const fs = require('fs');
const { Discoverer, DiscoveryService, Client } = require('fabric-common');
const { Gateway } = require('fabric-network');
const { buildWallet, buildCCP } = require('../Utils');


// const walletPath = 'Common/lib/serviceDiscovery/azureOne/Wallet';
// const connectionProfile = buildCCP('Common/lib/serviceDiscovery/azureOne/connection_profile.json');
const client = new Client('test-client'); // one for every instance
// const mspID = "azureOne"; through constructor
// const channelName = "ttz-12345-2222222222-1111111111"; through constructor
// const peer = "peer1.azureOne.com"; ??

const config = {
    userName: "Admin", // for now admins have the ability to send service discover req
    gatewayDiscovery: { enabled: false, asLocalhost: false  },
}

const discoverers = [];
const dsInstances = {};

const REFRESH_AGE_MSC = 500;

const DISCOVERER_TYPES = {
    MAIN: "main",
    REMOTE: "remote",
    LOCAL: "local"
}

function getPeerTlsCACertsPem(peer) {
    const tlsCACerts = connectionProfile.peers[peer].tlsCACerts;
    if (
        tlsCACerts === undefined ||
        (tlsCACerts.path === undefined && tlsCACerts.pem === undefined)
    ) {
        logger.error(`Not found tlsCACerts configuration: ${peer.url}`);
        return '';
    }

    if (tlsCACerts.path !== undefined) {
        return fs.readFileSync(
            tlsCACerts.path,
            'utf8'
        );
    }
    return tlsCACerts.pem;
}

async function generateFromGateway(channelName) {
    const gateway = new Gateway();
    let network;
    let idx;
    try {
        const wallet = await buildWallet(walletPath);
        await gateway.connect(connectionProfile, {
            wallet: wallet,
            identity: config.userName,
            discovery: config.gatewayDiscovery
        });
        network = await gateway.getNetwork(channelName);
        idx = gateway.identityContext;
    } catch (e) {
        throw Error(`Error generateFromGateway: ${e}`);
    } finally {
        gateway.disconnect();
    }
    return {
        network: network,
        idx: idx
    }
}

async function getDiscoveryService(network) {
    const channel = await network.getChannel();
    return new DiscoveryService('be discovery service', channel);
}

async function _buildTargets(client, mspID) {
    for (const [key, value] of Object.entries(connectionProfile.peers)) {
        const url = value.url;
        const pem = getPeerTlsCACertsPem(key);
        const discoverer = new Discoverer(`be discoverer ${key}`, client, mspID);
        let grpcOpt = {
            url: url,
            pem: pem
        };
        const peer_endpoint = client.newEndpoint(grpcOpt);
        await discoverer.connect(peer_endpoint);

        discoverers.push({
            orgName: mspID,
            discoverer: discoverer,
            status: await discoverer.checkConnection(),
            type: value.main ? DISCOVERER_TYPES.MAIN : DISCOVERER_TYPES.REMOTE // non-main local peer case not implemented for now
        })
    }
}

async function _getSuitableTargetList(orgName) {
    const main = discoverers.filter(element => element.main && element.orgName === orgName)[0];
    if (await _checkDiscovererConnection(main)) return [main];


    const others = discoverers.filter(async (element) => {
        return element.orgName === orgName &&
            await element.discoverer.checkConnection();
    });

    return others;
}

async function initializeServiceDiscovery(channelName) {
    try {
        const gatewayData = await generateFromGateway(channelName);
        const network = gatewayData.network;
        const idx = gatewayData.idx;

        const ds = await getDiscoveryService(network);

        ds.build(idx);
        ds.sign(idx);
        // building targets
        const targets = await _buildTargets(client, mspID);
        await ds.send({targets: targets, asLocalhost: false, refreshAge: REFRESH_AGE_MSC});
        return ds;
    } catch (e) {
        console.log(`${e.message}`);
    }
}

function _checkDsExists(channelName) {
    return (dsInstances[channelName] && dsInstances[channelName] instanceof DiscoveryService);
}

async function _checkDiscovererConnection(discoverer) {
    return await discoverer.checkConnection(false);
}

async function _createDiscoveryService(channelName) {
    const gatewayData = await generateFromGateway(channelName);
    const network = gatewayData.network;
    const idx = gatewayData.idx;

    const ds = await getDiscoveryService(network);

    ds.build(idx);
    ds.sign(idx);

    dsInstances[channelName] = ds;
    return ds;
}

function _updateConnectionProfile(discovered) {

}

async function main() {
    const ds = await initializeServiceDiscovery(channelName);
    let result = await ds.getDiscoveryResults(true);
    console.log(JSON.stringify(result.peers_by_org, null, 2));
    console.log("waiting for 1 min");
    await new Promise(r => setTimeout(r, 10000));
    console.log("done waiting");
    result = await ds.getDiscoveryResults(true);
    console.log(JSON.stringify(result.peers_by_org, null, 2));
}

main().then(() => console.log("ok"));

module.exports = class ServiceDiscoveryClient {
    async constructor(channelName, orgName) {
        await _buildTargets(new Client('service-discovery-client', orgName));
    }

    async newServiceDiscoveryRequest(channelName, orgName) {
        let ds;
        if (_checkDsExists(channelName)) ds = dsInstances[channelName];
        else ds = await _createDiscoveryService(channelName);

        if (ds.hasDiscoveryResults()) {
            const discovered = ds.getDiscoveryResults(true);
            _updateConnectionProfile(discovered);
            return discovered;
        }

        const targets = await _getSuitableTargetList(orgName);
        const discovered = await ds.send({targets: targets, asLocalhost: false, refreshAge: REFRESH_AGE_MSC});

        _updateConnectionProfile(discovered);

        return discovered;
    }
}










