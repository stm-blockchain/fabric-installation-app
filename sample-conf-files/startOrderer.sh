printf "\nCreate Org1"
printf "\nTLS Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"tls-ca-admin","password":"tls-ca-adminpw", "port":"7052", "isTls": true, "orgName": "Org1", "csrHosts": "0.0.0.0,*.Org1.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:5000/initCa

printf "\nOrg Ca Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"org-ca-admin","password":"org-ca-adminpw", "port":"7053", "isTls": false, "orgName": "Org1","csrHosts":"0.0.0.0,*.Org1.com", "adminName": "org-admin", "adminSecret": "org-adminpw"}' \
http://localhost:5000/initCa

printf "\nOrderer Init"
curl --header "Content-Type: application/json" --request POST \
--data '{"userName":"orderer1","password":"orderer1pw", "port":7050, "csrHosts": "0.0.0.0,*.Org1.com", "orgName": "Org1", "adminName": "osn-admin1", "adminPw":"osn-admin1pw"}' \
http://localhost:5000/initOrderer

cp $HOME/ttz/Org1/msp/tlscacerts/tls-ca-cert.pem $HOME/ttz/orderers/Org1-tls-ca-cert.pem
