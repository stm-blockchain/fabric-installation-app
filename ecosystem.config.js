module.exports = {
    apps : [{
        name   : "ttz-installation-server",
        script : "./Server/app.js",
        env: {
            FABRIC_CFG_PATH: "/home/test/work/fabric-2.3-example",
            INSTALL_LOG_LEVEL: "debug"
        }
    }]
}
