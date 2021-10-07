export BASE_PATH=/home/ttz/ttz/Org1

export FABRIC_CFG_PATH=/home/ttz/fabric/config

configtxgen -profile SampleNew -outputBlock $BASE_PATH/$CHANNEL_ID.genesis_block.pb -channelID $CHANNEL_ID

export ORDERER_TLS_CA=$BASE_PATH/fabric-ca/client/tls-ca-cert.pem
export ORDERER_ADMIN_CERT=$BASE_PATH/orderers/orderer1/adminclient/client-tls-cert.pem
export ORDERER_ADMIN_KEY=$BASE_PATH/orderers/orderer1/adminclient/client-tls-key.pem
export ORDERDER_ADMIN_ADDRESS=0.0.0.0:7051

osnadmin channel join --channelID $CHANNEL_ID --config-block $BASE_PATH/$CHANNEL_ID.genesis_block.pb -o $ORDERDER_ADMIN_ADDRESS --ca-file $ORDERER_TLS_CA --client-cert $ORDERER_ADMIN_CERT --client-key $ORDERER_ADMIN_KEY
