module.exports = {
    apps: [
        {
            name: "ttz-installation-server",
            autorestart: false,
            script: "./Server/app.js",
            env: {
                FABRIC_CFG_PATH: `${process.env.PWD}/config`,
                INSTALL_LOG_LEVEL: "debug"
            }
        },
        {
            name: "docker-check",
            autorestart: false,
            script: "./Common/lib/DockerSockCheck.js",
        }
    ]
}