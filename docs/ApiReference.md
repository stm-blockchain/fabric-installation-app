# API Reference
_**fabric-installation-app**_ works through the manipulation of `Common/` package invoked by http requests.

Below, you can find the referens for all http endpoints this app currently supports

## _/initCa_ 
>fabric-installation-app manages the Certificate Authorities in a production ready manner.
Meaing that it uses two separate [Fabric Ca](https://hyperledger-fabric-ca.readthedocs.io/en/release-1.4/)
servers for TLS communication and identities inside the same organization which are called tlsCa and orgCa
respectively. _**initCa/**_ is used for the initiation for both of them with a slightly different input
body.  

This method starts a [Fabric Ca](https://hyperledger-fabric-ca.readthedocs.io/en/release-1.4/) 
a server. Then enrolls bootstrapped CA(Certificate Authority) admin, creates
some necessary folders and files. Lastly if it is OrgCa that has been enrolled,
the orgCa registers and enrolls an org admin who will be authorized to work on 
orchestration of the peers. For instance joining a peer to a channel, installing,
approving, committing a chaincode etc. 


| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /initCa      | POST           | "Content-Type: application/json"

Sample Request Body for **tlsCa**
```json
{
    "userName": "tls-ca-admin",
    "password": "tls-ca-adminpw",
    "port": "7052",
    "isTls": true,  
    "orgName": "Org1",
    "csrHosts": "0.0.0.0,{internal_ip},{external_ip}",
    "adminName": "-",
    "adminSecret": "-"
}
``` 

Sample Request Body for **orgCa**
```json
{
    "userName": "org-ca-admin",
    "password": "org-ca-adminpw",
    "port": "7053",
    "isTls": false,
    "orgName": "Org1",
    "csrHosts": "0.0.0.0,{internal_ip},{external_ip}",
    "adminName": "org-admin",
    "adminSecret": "org-adminpw"
}
``` 

## _/initPeer_ 

This method registers and enrolls the new peer to Ca Nodes with the given credentials and then starts the peer with the
corresponding crypto material.

| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /initPeer      | POST           | "Content-Type: application/json"


Sample Request Body
```json
{
    "peerName": "peer1",
    "password": "peer1pw",
    "orgName": "Org1",
    "port": 7054,
    "csrHosts": "0.0.0.0,{internal_ip},{external_ip}",
    "externalIp": "{external_ip}",
    "internalIp": "{internal_ip}"
}
``` 

## _/initOrderer_ 
>Since fabric-installation-app uses the v2.3.1 of Hyperledger Fabric there is no system channel in the system. Instead 
>orderers can dynamically join and leave channels through the usage of `osnadmin` command which needs to be separatedly
>registered and enrolled to TLS CA server. So we are sending credential information for ``osnadmin`` user as well.

Registers and enrolls both _**orderer**_ and _**osnadmin**_ users then starts the orderer node with the corresponding 
crypto material. One important thing is that `osnadmin` server is configured to listen the port number that is increased by 
1 from the orderer node's listening port. So in the below sample case both 7050 and 7051 ports should be empty. 

| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /initOrderer      | POST           | "Content-Type: application/json"


Sample Request Body
```json
{
    "userName": "orderer1",
    "password": "orderer1pw",
    "port": 7050,
    "csrHosts": "0.0.0.0,{internal_ip},{external_ip}",
    "orgName": "Org1",
    "adminName": "osn-admin1",
    "adminPw": "osn-admin1pw"
}
``` 

## _/initClient_ 

Gives the information about whether or not there is already a network up in the local machine. If response body is empty,
this means there is no network up. If it is not empty, the indormation of the Ca Nodes (tlsCa and orgCa) along with the 
organizatiıon's name.

| Endpoint      | Method                            
| ------------- |--------  
| /initClient      | GET 


Sample Response Body If There is a Network
```json
{
    "orgName": "STM",
    "tlsCa": {
      "userName": "tls-ca-admin",
      "password": "tls-ca-adminpw",
      "port": "7052",
      "isTls": true,
      "orgName": "STM",
      "csrHosts": "0.0.0.0",
      "adminName": "",
      "adminSecret": ""
    },
    "orgCa": {
      "userName": "org-ca-admin",
      "password": "org-ca-adminpw",
      "port": "7053",
      "isTls": false,
      "orgName": "STM",
      "csrHosts": "0.0.0.0",
      "adminName": "org-admin",
      "adminSecret": "org-ca-admin"
    }
  }
``` 

## _/peers_ 

Returns the known peers of the organization.

| Endpoint      | Method                                
| ------------- |-------------
| /peers      | GET           


Sample Response Body 
```json
[
    {
        "peerName": "peer1",
        "password": "peer1pw",
        "orgName": "Org1",
        "host": "172.0.0.0",
        "port": 7058,
        "csrHosts": "0.0.0.0,{internal_ip},{external_ip}"
    }
]
``` 

## _/channels_ 

Returns the channels of particular peer has joined. 

| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /channels      | POST           | "Content-Type: application/json"


Sample Request Body
```json
{
    "peerConfig": {
        "peerName": "peer1",
        "orgName": "Org1"
    }
}
``` 

Sample Response Body
```json
[
    {
        "label": "testchannel-v1"
    },
    {
        "label": "testchannel-v2"
    },
    {
        "label": "testchannel-v3"
    }
]
``` 

## _/ccStates_ 

Returns the chaincodes present on a particular peer, and their states in terms of being installed, approved or commited. 

| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /ccStates      | POST           | "Content-Type: application/json"


Sample Request Body
```json
{
    "channelName": "testchannel-v1",
    "peerConfig": {
        "peerName": "peer1",
        "orgName": "Org1"
    }
}
``` 

Sample Response Body
```json
[
  {
  "state": "approved",
  "name": "javascript",
  "version": "0.0.1",
  "sequence": 1
  },
  {
  "state": "committed",
  "name": "testChaincode",
  "version": "0.0.1",
  "sequence": 1
  },
  {
  "state": "installed",
  "name": "testChaincodev2",
  "version": "0.0.1"
  }
]
``` 

## _/packages_ 

Returns the chaincode packages that are ready to be installed.

| Endpoint      | Method                                
| ------------- |-------------
| /packages      | GET           


Sample Response Body 
```json
[
    {
        "label": "javascript@0.0.1.tar.gz"
    },
    {
        "label": "sampleChaicode@0.0.1.tar.gz"
    }
]
``` 

## _/joinChannel_ 

Makes a particular peer join a certain channel.

| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /joinChannel      | POST           | "Content-Type: application/json"


Sample Request Body
```json
{
    "peerConfig": {
        "peerName": "peer1",
        "orgName": "Org1"
    },
    "ordererConfig": {
        "ordererAddress": "10.0.0.9:7050",
        "ordererOrgName": "Org2"
    },
    "channelName": "testchannel-v1"
}
``` 

## _/prepareCommit_ 
>There is a feature called in Hyperledger Fabric that is called _**chaincode lifecycle**_ which basicly contains the steps
>of a chaincode over the course of it being first installed to a peer to it being committed and ready to accept transactions.
>fabric-installation-app manages this lifecycle by grouping the `install` and `approve` states together and leaving the 
>commit state for another step since it needs to be done by only one peer.
 
Installs a chaincode to the specified peer and approves it if it is not approved before. 

| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /prepareCommit      | POST           | "Content-Type: application/json"


Sample Request Body
```json
{
    "peerConfig": {
        "peerName": "peer1",
        "orgName": "Org1"
    },
    "chaincodeConfig": {
        "ordererAddress": "10.0.0.9:7050",
        "ordererOrgName": "Org2",
        "channelId": "testchannel-v1",
        "ccName": "javascript",
        "version": "0.0.1",
        "seq": "1",
        "packageName": "javascript@0.0.1.tar.gz"
    }
}
``` 

## _/commitChaincode_ 
Commits a chaincode to the specified peers once every organization in the channel has approved the chaincode.

| Endpoint      | Method        | Headers                          
| ------------- |-------------  |  --------------------------------
| /commitChaincode      | POST           | "Content-Type: application/json"


Sample Request Body
```json
{
    "peerConfig": {
        "peerName": "peer1",
        "orgName": "Org1"
    },
    "commitConfig": {
        "ordererAddress": "10.0.0.9:7050",
        "ordererOrgName": "Org2",
        "channelId": "testchannel-v1",
        "ccName": "javascript",
        "version": "0.0.1",
        "seq": "1",
        "packageName": "javascript@0.0.1.tar.gz",
        "peers": [
            {"peerAddress": "10.0.0.5:7054", "orgName": "Org1"},
            {"peerAddress": "10.0.0.6:7054", "orgName": "Org3"}
        ]
    }
}
``` 