printf "\nCreate Org1"
printf "\nTLS Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"tls-ca-admin","password":"tls-ca-adminpw", "port":"7052", "isTls": true, "orgName": "Org1", "csrHosts": "0.0.0.0,*.Org1.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:8080/initCa

printf "\nOrg Ca Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"org-ca-admin","password":"org-ca-adminpw", "port":"7053", "isTls": false, "orgName": "Org1","csrHosts":"0.0.0.0,*.Org1.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:8080/initCa

printf "\nOrderer Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"orderer1","password":"orderer1pw", "port":7050, "csrHosts": "0.0.0.0,*.Org1.com", "orgName": "Org1", "adminName": "osn-admin1", "adminPw":"osn-admin1pw"}' \
http://localhost:8080/initOrderer

printf "\nCreate Org2"
echo "TLS Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"tls-ca-admin","password":"tls-ca-adminpw", "port":"7056", "isTls": true, "orgName": "Org2", "csrHosts": "0.0.0.0,*.Org2.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:8080/initCa

printf "\nOrg Ca Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"org-ca-admin","password":"org-ca-adminpw", "port":"7057", "isTls": false, "orgName": "Org2","csrHosts":"0.0.0.0,*.Org2.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:8080/initCa

printf "\nPeer Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"peerName": "peer1", "password":"peer1", "orgName":"Org2", "port": 7058, "csrHosts": "0.0.0.0,*.Org2.com"}' \
http://localhost:8080/initPeer

printf "\nCreate Org3"
echo "TLS Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"tls-ca-admin","password":"tls-ca-adminpw", "port":"7060", "isTls": true, "orgName": "Org3", "csrHosts": "0.0.0.0,*.Org3.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:8080/initCa

printf "\nOrg Ca Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"org-ca-admin","password":"org-ca-adminpw", "port":"7061", "isTls": false, "orgName": "Org3","csrHosts":"0.0.0.0,*.Org3.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:8080/initCa

printf "\nPeer Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"peerName": "peer1", "password":"peer1", "orgName":"Org3", "port": 7062, "csrHosts": "0.0.0.0,*.Org3.com"}' \
http://localhost:8080/initPeer

cp $HOME/ttz/Org1/msp/tlscacerts/tls-ca-cert.pem $HOME/ttz/orderers/Org1-tls-ca-cert.pem
cp $HOME/ttz/Org2/msp/tlscacerts/tls-ca-cert.pem $HOME/ttz/tlsRootCerts/Org2-tls-ca-cert.pem
cp $HOME/ttz/Org3/msp/tlscacerts/tls-ca-cert.pem $HOME/ttz/tlsRootCerts/Org3-tls-ca-cert.pem
cp $HOME/work/fabric-2.3-example/javascript@0.0.1.tar.gz $HOME/ttz/chaincodes

./createChannel.sh

sleep 1
curl --header "Content-Type: application/json" --request POST \
--data '{"peerConfig": {"peerName": "peer1", "orgName": "Org2"}, "ordererConfig": {"ordererAddress": "0.0.0.0:7050", "ordererOrgName": "Org1"}, "channelName": "testchannel"}' \
http://localhost:8080/joinChannel

sleep 1
curl --header "Content-Type: application/json" --request POST \
--data '{"peerConfig": {"peerName": "peer1", "orgName": "Org3"}, "ordererConfig": {"ordererAddress": "0.0.0.0:7050", "ordererOrgName": "Org1"}, "channelName": "testchannel"}' \
http://localhost:8080/joinChannel

sleep 1
curl --header "Content-Type: application/json" --request POST \
--data '{"peerConfig": {"peerName": "peer1", "orgName": "Org2"},"chaincodeConfig": {"ordererAddress": "0.0.0.0:7050", "ordererOrgName": "Org1", "channelId": "testchannel", "ccName": "javascript", "version": "0.0.1", "seq": "1", "packageName": "javascript@0.0.1.tar.gz"}}' \
http://localhost:8080/prepareCommit

sleep 1
curl --header "Content-Type: application/json" --request POST \
--data '{"peerConfig": {"peerName": "peer1", "orgName": "Org3"},"chaincodeConfig": {"ordererAddress": "0.0.0.0:7050", "ordererOrgName": "Org1", "channelId": "testchannel", "ccName": "javascript", "version": "0.0.1", "seq": "1", "packageName": "javascript@0.0.1.tar.gz"}}' \
http://localhost:8080/prepareCommit