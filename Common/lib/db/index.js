const { Pool } = require('pg');
const config = require("../context/config");

const pool = new Pool({
    user: `${config.dbUserName}`,
    host: `${config.dbHost}`,
    database: `${config.dbName}`,
    password: `${config.dbPassword}`,
    port: `${config.port}`
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    endPool: () => pool.end()
}

