module.exports = {
    sessionStore:'mongodb://localhost/sessionStore/session',
	sessionSecret: '076ee61d63aa10a125ea872411e433b9',
	port: 8080,
	uri: 'http://localhost:8080', // Without trailing /
    redis: {
        host: 'localhost',
        port: 6379
    },
    mongodb_production: 'mongodb://localhost/fablab_production',
    mongodb_development: 'mongodb://localhost/fablab_development',
    socketio: {
        level: 2
    },
	environment: (process.env.NODE_ENV !== 'production') ? 'development' : 'production',
	selenium : {
		testtimeout : 60000
	},	
	db:{
      db: 'myDb',
      host: '192.168.1.111',
      port: 6646,  // optional, default: 27017
      username: 'admin', // optional
      password: 'secret', // optional
      collection: 'mySessions' // optional, default: sessions
    },
    logging:{
        console:{
        enabled:true,
        level:"info",
        timestamp:true,
        colorize:true
    },
    file:{
        enabled:false,
        level:"info",
        filepath:"logs/calipso.log",
        timestamp:true
        }
    },
	demo:{
	     enabled: true,
         user: 'demo',
         password: 'demo'
	} 
};

if (module.exports.environment == 'production') {
	module.exports.port = process.env.PORT || 80; // Joyent SmartMachine uses process.env.PORT
    module.exports.uri = 'http://localhost:'+module.exports.port;
}