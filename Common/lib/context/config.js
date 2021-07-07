module.exports = {
    name: process.env.CONTEXT_DB_CONTAINER_NAME || "context_postgres",
    dbUserName: process.env.CONTEXT_DB_USER || "context_user",
    dbPassword: process.env.CONTEXT_DB_PASSWORD || "mysecretpassword",
    dbName: process.env.CONTEXT_DB_NAME || "context_db",
    dbHost: process.env.CONTEXT_DB_HOST || "localhost",
    port: process.env.DB_PORT || "5432"
}