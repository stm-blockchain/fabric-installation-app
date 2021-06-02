#!/bin/bash

docker-compose -p fabric-2.3 up -d tlsca.Org1.com
sleep 5

mkdir $PWD/Org1/client
mkdir $PWD/Org1/msp
cp $PWD/Org1/server/tls-ca/crypto/ca-cert.pem $PWD/Org1/client/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=$PWD/Org1/client
export FABRIC_CA_CLIENT_TLS_CERTFILES=$PWD/Org1/client/tls-ca-cert.pem

set -x
fabric-ca-client enroll -u https://tls-ca-admin:tls-ca-adminpw@0.0.0.0:8052 -M tls-ca/admin/msp --csr.hosts '0.0.0.0,*.Org1.com' --enrollment.profile tls
{ set +x; } 2>/dev/null

set -x
fabric-ca-client register --id.name org-ca-admin --id.secret org-ca-adminpw --id.type admin -u https://0.0.0.0:8052 -M tls-ca/admin/msp
{ set +x; } 2>/dev/null

set -x
fabric-ca-client register --id.name peer1 --id.secret peer1pw --id.type peer -u https://0.0.0.0:8052 -M tls-ca/admin/msp
{ set +x; } 2>/dev/null

set -x
fabric-ca-client enroll -u https://org-ca-admin:org-ca-adminpw@0.0.0.0:8052 -M tls-ca/orgadmin/msp --csr.hosts '0.0.0.0,*.Org1.com' --enrollment.profile tls
{ set +x; } 2>/dev/null

set -x
fabric-ca-client enroll -u https://peer1:peer1pw@0.0.0.0:8052 -M tls-ca/peer1/msp --csr.hosts '0.0.0.0,*.Org1.com' --enrollment.profile tls
{ set +x; } 2>/dev/null

mkdir -p $PWD/Org1/server/org-ca/tls
mv $PWD/Org1/client/tls-ca/orgadmin/msp/keystore/*_sk $PWD/Org1/client/tls-ca/orgadmin/msp/keystore/key.pem
cp $PWD/Org1/client/tls-ca/orgadmin/msp/signcerts/cert.pem $PWD/Org1/server/org-ca/tls/
cp $PWD/Org1/client/tls-ca/orgadmin/msp/keystore/key.pem $PWD/Org1/server/org-ca/tls/

docker-compose -p fabric-2.3 up -d orgca.Org1.com
sleep 5

set -x
fabric-ca-client enroll -u https://org-ca-admin:org-ca-adminpw@0.0.0.0:8053 -M org-ca/admin/msp --csr.hosts '0.0.0.0,*.Org1.com'
{ set +x; } 2>/dev/null

set -x
fabric-ca-client register --id.name peer1 --id.secret peer1pw --id.type peer -u https://0.0.0.0:8053 -M org-ca/admin/msp
{ set +x; } 2>/dev/null

set -x
fabric-ca-client register --id.name org-admin --id.secret org-adminpw --id.type admin -u https://0.0.0.0:8053 -M org-ca/admin/msp
{ set +x; } 2>/dev/null

set -x
fabric-ca-client enroll -u https://org-admin:org-adminpw@0.0.0.0:8053 -M org-ca/orgadmin/msp --csr.hosts '0.0.0.0,*.Org1.com'
{ set +x; } 2>/dev/null

set -x
fabric-ca-client enroll -u https://peer1:peer1pw@0.0.0.0:8053 -M org-ca/peer1/msp --csr.hosts '0.0.0.0,*.Org1.com'
{ set +x; } 2>/dev/null

mkdir $PWD/Org1/msp/tlscacerts
mkdir $PWD/Org1/msp/cacerts
cp $PWD/Org1/client/tls-ca-cert.pem $PWD/Org1/msp/tlscacerts/
cp $PWD/config.yaml $PWD/Org1/msp/
cp $PWD/Org1/client/org-ca/peer1/msp/cacerts/0-0-0-0-8053.pem $PWD/Org1/msp/cacerts/
mv $PWD/Org1/client/tls-ca/peer1/msp/keystore/*_sk $PWD/Org1/client/tls-ca/peer1/msp/keystore/key.pem
mv $PWD/Org1/client/org-ca/peer1/msp/keystore/*_sk $PWD/Org1/client/org-ca/peer1/msp/keystore/key.pem
mkdir -p $PWD/Org1/peer1/tls

cp $PWD/Org1/client/tls-ca-cert.pem $PWD/Org1/peer1/tls/tls-ca-cert.pem
mkdir $PWD/Org1/peer1/localMsp
cp -r $PWD/Org1/client/org-ca/peer1/msp/* $PWD/Org1/peer1/localMsp/
cp $PWD/config.yaml $PWD/Org1/peer1/localMsp
cp $PWD/Org1/client/tls-ca/peer1/msp/signcerts/cert.pem $PWD/Org1/peer1/tls/Org1-peer1-tls-cert.pem
cp $PWD/Org1/client/tls-ca/peer1/msp/keystore/key.pem $PWD/Org1/peer1/tls/Org1-peer1-tls-key.pem

docker-compose -p fabric-2.3 up -d peer1.Org1.com
docker-compose -p fabric-2.3 up -d cli.peer1.Org1.com
