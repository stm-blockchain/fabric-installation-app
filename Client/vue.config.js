module.exports = {
	publicPath: process.env.NODE_ENV === 'production' ? '/sigma-vue' : '/',
    devServer: {
	    allowedHosts: ['localhost'],
        port: 8080,
        https: false
    }
}