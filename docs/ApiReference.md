# API Reference
_**fabric-installation-app**_ works through the manipulation of `Common/` package invoked by http requests.

Below, you can find the referens for all http endpoints this app currently supports

#### _initCa_ 
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

Sample Body for **tlsCa**
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

Sample Body for **orgCa**
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

#### _initPeer_ 
>fabric-installation-app manages the Certificate Authorities in a production ready manner.
Meaing that it uses two separate [Fabric Ca](https://hyperledger-fabric-ca.readthedocs.io/en/release-1.4/)
servers for TLS communication and identities inside the same organization which are called tlsCa and orgCa
respectively. _**initCa/**_ is used for the initiation for both of them with a slightly different input
body. 