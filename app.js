var fs = require('fs');
var express = require('express');
var http = require('http');
var domain = require('domain');
var crypto = require('crypto');
var https = require('https');
var app = express();

var config = require('./conf/config.js');
var colors = require('colors');
var webdir = '/web';
var mobiledir = '/mobile';
var access_logfile = fs.createWriteStream('./access.log',{flags:'a'});

// Virtual Hosts


// mongodb session
/*
var MongoStore = require('connect-mongo')(express);
var sessionStore = new MongoStore({url: config.sessionStore}, function() {
    	                  console.log('connect mongodb session success...');
})

// redis session
//host: config.redis.host, port: config.redis.port,
*/
var RedisStore  = require("connect-redis")(express);
var sessionStore = new RedisStore({  client:  require("redis").createClient(config.redis.port,config.redis.host) },function() {
    	                  console.log('connect redis session success...');
});


exports.sessionStore= sessionStore;


//  allowed cross domain
var allowCrossDomain = function(req, res, next) {
  // Added other domains you want the server to give access to
  // WARNING - Be careful with what origins you give access to
  var allowedHost = [
    'http://localhost',
    'http://readyappspush.herokuapp.com/',
    'http://shielded-mesa-5845.herokuapp.com/'
  ];

  if(allowedHost.indexOf(req.headers.origin) !== -1) {
    //res.header('Access-Control-Allow-Max-Age', maxAge);
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    next();
  } else {
    res.send(404);
  }
};


/**********************************************
         express configuration
**********************************************/
app.configure(function(){

    app.engine('.html', require('ejs').__express);
    app.set('view engine', 'html');
	app.set('views',__dirname+'/views');
	
	app.use(express.favicon(__dirname + '/public/favicon.ico'));
	
  // should be placed before express.static
  app.use(express.compress({
    filter: function (req, res) {
      return /json|text|javascript|css/.test(res.getHeader('Content-Type'));
    },
    level: 9
  })); 	
	
	 // bodyParser should be above methodOverride
	app.use(express.bodyParser({uploadDir:__dirname+'/public/uploads',keepExtensions: true,limit: '50mb'}));
	app.use(express.methodOverride());
	//  // cookieParser should be above session
	app.use(express.cookieParser());
	 // express/mongo session storage  //  
    app.use(express.session({ 
					  cookie: { maxAge: 24 * 60 * 60 * 1000 }
    	              ,store: sessionStore
    	              ,secret: config.sessionSecret
					  ,key: 'express.sid'
					  ,clear_interval: 3600
    }));

	//app.use(express.logger({stream:access_logfile,format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms'}));

	/*  
    app.use(express.csrf()); 
    app.use(function(req, res, next){
      res.locals.token = req.session._csrf;
	  res.locals.year = new Date().getFullYear();
      next();
    });
*/
	  
	app.use(express.static(__dirname+'/public'));	
	
	app.use(webdir, 	express.static(__dirname+webdir));
	app.use(mobiledir,	express.static(__dirname+mobiledir));
	// put at last	
	app.get('/version', function(req, res) {
        res.send('0.0.1');
    });	

	// error handling 
    app.use(logErrors);
    app.use(clientErrorHandler);
    app.use(errorHandler); 

    app.use(function (req,res, next) {
        var d = domain.create();
        //
        d.on('error', function (err) {
          logger.error(err);
          res.statusCode = 500;
          res.json({sucess:false, messag: 'error in the server'});
          d.dispose();
        });
        d.add(req);
        d.add(res);
        d.run(next);
    });	
	
	/*
	app.use(function(req,res,next){
	    //console.log(req.ip,req.header('Referer'));	
	http://hublog.hubmed.org/archives/001927.html
       var City = geoip.City;
       var city = new City('public/GeoLiteCity.dat');
       // Synchronous method
       var city_obj = city.lookupSync('8.8.8.8');
       console.log(city_obj);
		   
	   next();
	});
	
    app.use (function (req, res, next) {
        var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
        if (schema === 'https') {
            next();
        } else {
           res.redirect('https://' + req.headers.host + req.url);
        }
    });	
    */
    //http://stackoverflow.com/questions/10697660/force-ssl-with-expressjs-3	
	app.use(function(req, res, next) {
       if(!req.secure) {
	      console.log('not secure'.red,req.headers.host,req.get('Host'),req.url);
          return res.redirect('https://' + req.get('Host') + req.url);
        }
		console.log('secure '.green);
        next();
    });
	app.set('trust proxy', true);
	
	app.use(app.router);	
    app.use(function(req, res, next){
        res.status(404); 
        if(req.xhr){
            res.send({ error: 'Not found' });
            return;		
		}		
        if (req.accepts('html')) {
            res.render('error/404', { url: req.url });
            return;
        }
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }
        res.type('txt').send('Not found');
    });	
});

app.configure('development',function(){
	app.set('db-uri',config.mongodb_development);
    app.use(express.bodyParser({uploadDir:'/uploads',keepExtensions: true,limit: '50mb'}));	
	app.use(express.static(__dirname+'/public'));
	console.log('app on development');
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production',function(){
	app.set('db-uri',config.mongodb_production);
    app.use(express.bodyParser({uploadDir:'/uploads',keepExtensions: true,limit: '50mb'}));	
	app.use(express.static(__dirname+'/public'));
	console.log('app on production');
	app.use(express.errorHandler())
});


/******************************************
           error handling   logging
*******************************************/



function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, { error: 'Something blew up!' });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error/500', { error: err });
}



var options = {
/*		*/
        key: fs.readFileSync('./conf/server.key').toString()
        ,cert: fs.readFileSync('./conf/server.crt').toString()
        ,requestCert: true
        ,rejectUnauthorized: false
		,passphrase: "1027"
 
};


if (!module.parent) {
    if(app){
	  /**/var out = app.listen(config.port, '0.0.0.0',function(){
	     console.log('Express started on port',config.port);	  
	  });
	  
	  process.nextTick(function () {
        if (out && out.address && out.address().port !== config.port) {
          console.log("server listening on port: ".red + out.address().port);
        }
      });
      https.createServer(options,app).listen(443, function(){
            console.log("Express server listening on port " + 433);
      });
    }else{
      console.log("\r\ terminated ...\r\n".grey);
      process.exit();
    }
}



/******************************************************
            cluster2 
https://gist.github.com/dsibilly/2992412			
http://stackoverflow.com/questions/10663809/how-do-i-use-node-js-clusters-with-my-simple-express-app
http://stackoverflow.com/questions/7845478/node-js-express-cluster-and-high-cpu-usage
http://weblog.plexobject.com/?p=1697
*****************************************************
var Cluster = require('cluster2')
var c = new Cluster({
    port: 8080
	,cluster: false
	,timeout: 500

	,ecv: {
        path: '/ecv', // Send GET to this for a heartbeat
        control: true, // send POST to /ecv/disable to disable the heartbeat, and to /ecv/enable to enable again
        monitor: '/',
        validator: function() {
            return true;
        }
    }

});

c.on('died', function(pid) {
    console.log('Worker ' + pid + ' died');
});
c.on('forked', function(pid) {
    console.log('Worker ' + pid + ' forked');
});

c.listen(function(cb) {
	// You need to pass the app. monApp is optional. 
	// If monApp is not passed, cluster2 creates one for you.
	if(app)
    cb(app);
});


var cluster = require('cluster')

var numCPUs = require('os').cpus().length;
if(cluster.isMaster){
    for(var i=0;i<numCPUs;i++){
        cluster.fork();
    }
    cluster.on('death',function(worker){
            console.log('worker'+worker.id+' is death');
            cluster.fork();
    });
}else{
    app.listen(config.port,'0.0.0.0',function(){
	     console.log('Express started on port',config.port);	  
	});
}
*/
/******************************************
           terminate the server
*******************************************/
app.on('close', function () {
  console.log("Closed");
  mongoose.connection.close();
  redisClient.quit();
});
//  terminator === the termination handler.
function terminator(sig) {
   if (typeof sig === "string") {
      console.log('%s: Received %s - terminating Node server ...',
                  Date(Date.now()), sig);
      process.exit(1);
	  app.close();
   }
   console.log('%s: Node server stopped.', Date(Date.now()) );
}

//  Process on exit and signals.
process.on('exit', function() { terminator(); });

['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { terminator(element); });
});
var util = require("util");
// Don't crash on errors.
process.on("uncaughtException", function(error) {
  util.log("uncaught exception: " + error);
  util.log(error.stack);
});

/*********************************************

        mongoose mongodb

**********************************************/

// mongodb mongoose
var mongoose = require('mongoose');
//mongoose.connect(config.mongodb.connectionString || 'mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server +'/' + config.mongodb.database);
//mongoose.createConnection('localhost', 'database', port, opts);
//var opts = { server: { auto_reconnect: false,poolSize: 10 }, user: 'username', pass: 'mypassword',replset: { strategy: 'ping', rs_name: 'testSet' } }
mongoose.connect(config.mongodb_development,function(err){
	if(err) console.log('connect mongodb error');
	else console.log('mongodb connect success');
});

mongoose.connection.on('open', function (err) {
      if (reconnTimer) { clearTimeout(reconnTimer); reconnTimer = null; }

	  mongoose.connection.db.admin().serverStatus(function(err, data) { 
	    if (err) {
	      if (err.name === "MongoError" && err.errmsg === 'need to login') {
	        console.log('Forcing MongoDB authentication');
	        mongoose.connection.db.authenticate(config.mongodb.user, config.mongodb.password, function(err) {
	          if (!err) return;
	          console.error(err);
	          process.exit(1);
	        });
	        return;
	      } else {
	        console.error(err);
	        process.exit(1);
	      }
	      
	      if (!semver.satisfies(data.version, '>=2.1.0')) {
	          console.error('Error: Uptime requires MongoDB v2.1 minimum. The current MongoDB server uses only '+ data.version);
	          process.exit(1);
	      };

          //setTimeout(connectWithRetry, 5000);	      
	    }
	    else{
	    	console.log('mongod db open success');
	    }
	  });
});


/****************************
   mongoose retry
   https://gist.github.com/taf2/1058819
****************************/
var reconnTimer = null;
 
function tryReconnect() {
  reconnTimer = null;
  console.log("try to connect: %d", mongoose.connection.readyState);
  db = mongoose.connect(config.mongodb_development,function(err){
	if(err) console.log('connect mongodb error');
	else console.log('mongodb connect success');
  });
}

mongoose.connection.on('opening', function() {
  console.log("reconnecting... %d", mongoose.connection.readyState);
});

mongoose.connection.on('connecting', function (err) {

});

mongoose.connection.on('disconnecting', function (err) {

});

mongoose.connection.on('disconnected', function (err) {

});

mongoose.connection.on('close', function (err) {
  mongoose.connection.readyState = 0; // force...
  mongoose.connection.db.close(); // removeAllListeners("reconnect");
 
  if (reconnTimer) {
    console.log("already trying");
  }
  else {
    reconnTimer = setTimeout(tryReconnect, 500); // try after delay
  }
});

mongoose.connection.on('reconnected', function (err) {

});

mongoose.connection.on('error', function (err) {
    console.error(err);
});

/*******************************************
 mongodb close
********************************************/

function done (err) {
  if (err) console.error(err.stack);
  mongoose.connection.db.dropDatabase(function () {
    mongoose.connection.close();
  });
}

/// file grid
var GridStore = mongoose.mongo.GridStore;
var db = mongoose.connection.db;

/*********************************************

        redis


 
var redis_ip= config.redis.host;  
var redis_port= config.redis.port; 

var redis = require("redis"),
redisClient = redis.createClient(redis_port,redis_ip); 

redisClient.auth(config.opt.redis_auth, function(result) {
	console.log("Redis authenticated.");  
})

redisClient.on("error", function (err) {  
     console.log("redis Error " + err.red);  
     return false;  
});    

redisClient.on('connect',function(err){
	console.log('redis connect success');
})
**********************************************/




///////////////////////////////////////////////////// 
exports.app = app;
exports.mongoose = mongoose;
exports.GridStore = GridStore;
// management modulers


bootControllers(app);

// Bootstrap controllers
function bootControllers(app) {
	fs.readdir(__dirname + '/routes', function(err, files){
		if (err) throw err;
		files.forEach(function(file){
		/*
            fs.stat(file.path, function(err,stats){			
			   if(stats.isFile()){
			   }
			})
		*/	 
			 bootController(app, file);				
		});
	});
}

function bootController(app, file) {
	var name = file.replace('.js', '');
	console.log(__dirname + '/routes/'+ name);
	require(__dirname + "/routes/"+ name);				
}


