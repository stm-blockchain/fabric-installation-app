const fs = require('fs');
const { Discoverer, DiscoveryService, Client } = require('fabric-common');
const { Gateway } = require('fabric-network');
const { buildWallet, buildCCP } = require('../Utils');

const gateway = new Gateway();
const walletPath = './serviceDiscoveryTest/azureOne/Wallet';
const connectionProfile = buildCCP('./serviceDiscoveryTest/azureOne/connection_profile.json');
const client = new Client('test-client');
const mspID = "azureOne";
const channelName = "ttz-12345-2222222222-1111111111";
const peer = "peer1.azureOne.com";

const config = {
    userName: "Admin",
    gatewayDiscovery: { enabled: true, asLocalhost: false  },
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

async function serviceDiscovery(channelName) {
    try {
        const wallet = await buildWallet(walletPath);
        try {
            await gateway.connect(connectionProfile, {
                wallet: wallet,
                identity: config.userName,
                discovery: config.gatewayDiscovery
            });
        } catch (e) {
            console.log(e);
        }

        const network = await gateway.getNetwork(channelName);
        const channel = network.getChannel();
        const ds = new DiscoveryService('be discovery service', channel);

        const idx = gateway.identityContext;
        // do the three steps
        ds.build(idx);
        ds.sign(idx);
        const url = connectionProfile.peers[peer].url;
        const pem = getPeerTlsCACertsPem(peer);
        const discoverer = new Discoverer(`be discoverer ${peer}`, client, mspID);
        let grpcOpt = {url: url,
            pem: pem};
        const peer_endpoint = client.newEndpoint(grpcOpt);
        await discoverer.connect(peer_endpoint);
        // const discovery_results = await ds.send({targets: [discoverer], asLocalhost: false});
        await ds.send({targets: [discoverer], asLocalhost: false});
        // console.log(ds.discoveryResults);
        return ds.discoveryResults;
    } catch (e) {
        console.log(`${e.message}`);
    }
}

serviceDiscovery(channelName).then((result) => {
    console.log(JSON.stringify(result, null, 2));
}).catch( e => {
    console.log(e);
})