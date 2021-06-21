// const installation = require("./lib/installation")

module.exports.Installation = require("./lib/installation")
module.exports.CaNode = require("./lib/CaNode")
module.exports.PeerNode = require("./lib/PeerNode")
module.exports.OrdererNode = require(`./lib/OrdererNode`)
module.exports.DockerApi = require(`./lib/dockerApi`).DockerApi;