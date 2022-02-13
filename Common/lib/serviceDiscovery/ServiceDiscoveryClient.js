const fs = require('fs');
const { Discoverer, DiscoveryService, Client } = require('fabric-common');
const { Gateway } = require('fabric-network');
const { buildWallet, buildCCP } = require('../Utils');


const walletPath = 'Common/lib/serviceDiscovery/azureOne/Wallet';
const connectionProfile = buildCCP('Common/lib/serviceDiscovery/azureOne/connection_profile.json');
const client = new Client('test-client');
const mspID = "azureOne";
const channelName = "ttz-12345-2222222222-1111111111";
const peer = "peer1.azureOne.com";

const config = {
    userName: "Admin",
    gatewayDiscovery: { enabled: false, asLocalhost: false  },
}

const REFRESH_AGE_MSC = 500;

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

async function buildTargets(client, mspID) {
    let targets = [];
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
        targets.push(discoverer);
    }
    return targets;
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
        const targets = await buildTargets(client, mspID);
        await ds.send({targets: targets, asLocalhost: false, refreshAge: REFRESH_AGE_MSC});
        return ds;
    } catch (e) {
        console.log(`${e.message}`);
    }
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