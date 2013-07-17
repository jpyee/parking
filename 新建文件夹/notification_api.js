var mongoose = require("mongoose")
    , GridStore = mongoose.mongo.GridStore
    , ObjectID = mongoose.mongo.BSONPure.ObjectID;
var crypto = require('crypto');	
var _=require('underscore');

var config = require('../conf/config.js');
var app = require('../app.js').app;

var moment = require('moment');	
var redis = require('redis'),
    fs = require('fs'),
	io = require('socket.io');
/*********************************************

redis
https://github.com/helxsz/Realtime-Demo/blob/master/helpers.js

 
https://gist.github.com/scttnlsn/3210919
**********************************************/
 
var redis_ip= config.redis.host;  
var redis_port= config.redis.port; 

var redisClient = redis.createClient(redis_port,redis_ip); 
/*
redisClient.auth(config.opt.redis_auth, function(result) {
	console.log("Redis authenticated.");  
})
*/ 
redisClient.on("error", function (err) {  
     console.log("redis Error " + err.red);  
     return false;  
});    

redisClient.on('connect',function(err){
	console.log('redis connect success');
})




/****************************************************
scenaio 1:  tutor or students submits a question / in a location, publish ( channel/ tag, question ),publish(channel/geo, question), 
            a application subsubibe to channel/ tag,channel/geo , push to a queue.
			then when a use logins in, he receives the message in the queue for the channel/tag, channel/geo.
			get the latest actions on the channel/tag, channel/geo,  use queue and pub/sub.
			
the people in this location receives the question or courses updated,  subscribe (channel, )

scenaio 2:
           once tutor logins, he receives the latest messages on the tutor or students

*****************************************************/
var subscriptionPattern = 'channel:*';
redisClient.psubscribe(subscriptionPattern);
redisClient.on('pmessage', function(pattern, channel, message){
    
    /* Every time we receive a message, we check to see if it matches
       the subscription pattern. If it does, then go ahead and parse it. */

	if(pattern == subscriptionPattern){
	    try {
    		var data = JSON.parse(message)['data'];   		
    		// Channel name is really just a 'humanized' version of a slug
    		// san-francisco turns into san francisco. Nothing fancy, just
    		// works.
    		var channelName = channel.split(':')[1].replace(/-/g, ' ');
	    } catch (e) {
	        return;
	    }

		// Store individual media JSON for retrieval by homepage later
		for(index in data){
		    var media = data[index];
		    media.meta = {};
		    media.meta.location = channelName;
			var r = redis.createClient(redis_port,redis_ip);
			r.lpush('media:objects', JSON.stringify(media));
			r.quit();
		}

		// Send out whole update to the listeners
		/*
		var update = {
			'type': 'newMedia',
			'media': data,
			'channelName': channelName
		};
		for(sessionId in socket.clients){
			socket.clients[sessionId].send(JSON.stringify(update));
		}
		*/
	}
});



function getMedia(callback){
    // This function gets the most recent media stored in redis
    var r = redis.createClient(redis_port,redis_ip);
	r.lrange('media:objects', 0, 14, function(error, media){
	    // Parse each media JSON to send to callback
	    media = media.map(function(json){return JSON.parse(json);});
	    callback(error, media);
	});
	r.quit()
}
exports.getMedia = getMedia;

app.get('/real_time_media', function(req, res){
    getMedia(function(error, media){
		res.send({images:media});
	});
});



////////////////////////////////////////////////////////////////////////

/* 
1.  instagram real time api,  webhook
http://blog.instagram.com/post/8756150468/a-real-time-api-for-next-generation-apps	
1) As a developer, you can sign up for the API at http://instagram.com/developer/ 
2) You can then create a subscription using a simple command as outlined in the real-time section of the documentation 
3) Every time there¡¯s an update to a subscription, our servers POST an update your server using a simple web hook. 
4) Your servers then query for the latest information. These subscriptions and the new API enable three major enhancements to Instagram:
	
2. verify this signature to validate the integrity and origin of the payload
     
	//http://stackoverflow.com/questions/4390543/facebook-real-time-update-validating-x-hub-signature-sha1-signature-in-c-sharp

	
	api
	https://help.github.com/articles/post-receive-hooks  webhooks
	http://pusher.com/docs/webhooks
	http://instagram.com/developer/realtime/
	https://manage.stripe.com/login?redirect=%2F#account/webhooks
	code :
	//  https://github.com/boucher/stripe-payments-webhook-node/blob/master/server.js
	// client to server side  https://github.com/Strider-CD/strider/blob/master/lib/backchannel.js
	// server to client side  https://github.com/helxsz/Realtime-Demo/blob/master/server.js		
*/ 
app.post('/callbacks/geo/:geoName', function(req, res){

    // First, let's verify the payload's integrity by making sure it's coming from a trusted source. We use the client secret as the key to the HMAC.
	var hmac = crypto.createHmac('sha1', 'secret');
    hmac.update(req.rawBody);
    var providedSignature = req.headers['x-hub-signature'];
    var calculatedSignature = hmac.digest(encoding='hex');
    // If they don't match up or we don't have any data coming over the wire, then bail out early. 
    if((providedSignature != calculatedSignature) || !request.body)
    res.send('FAIL');
	
	res.send('OK');
})


/****************************************************************************
http://burakdede.com/2012/10/20/design-realtime-notification-system-with-tornado/
                  notification
http://liamkaufman.com/blog/2012/06/04/redis-and-relational-data/
http://stackoverflow.com/questions/12166698/receiving-reply-from-redis-zrange
http://stackoverflow.com/questions/9459814/storing-and-retrieving-sockets-in-redis
http://ricochen.wordpress.com/2012/02/28/example-sorted-set-functions-with-node-js-redis/

https://gist.github.com/cwholt/1854283
http://stackoverflow.com/questions/10248927/node-js-control-from-the-master-cluster

http://liamkaufman.com/blog/page/2/
*****************************************************************************/
//https://localhost/user/519985ed86e35aec15000001/notify 
app.get('/user/:id/notify',function(req,res,next){
    console.log('get user notify'.green);
    pullUserNotification(req.params.id,function(err,data){	
	    if(err) { console.log(err); next(err)}
		else {
		    res.send(200,{'notifications':data});
		}
	})
})

function pushUserNotification(targetUID,UID,verb,msg){
    var redisClient = redis.createClient(redis_port,redis_ip); 
    redisClient.zadd('noti:'+targetUID,new Date().getTime(),JSON.stringify({'u':UID,'v':verb,'m':msg}));
	redisClient.incrby('noti:'+targetUID+':count',1);
	redisClient.quit();
}
/*
pushUserNotification('a','b','follow','url');
pushUserNotification('a','c','follow','url');
pushUserNotification('a','d','follow','url');
pushUserNotification('a','e','follow','url');

//pullUserNotification('a');
//pullUserNotificationCount('a');

//removeNewUserNotification('a');

//pullUserNotificationCount('a');
*/
function pullUserNotificationCount(targetUID,callback){
    var redisClient = redis.createClient(redis_port,redis_ip);
	redisClient.get('noti:'+targetUID+':count',function(err,data){
	    if(err) {  console.log('pullUserNotificationCount'.red,data); callback(err,null);}
	    else { 
		   console.log('pullUserNotificationCount noti count'.green,data);
		   callback(null,data);
        }		   
	})
	redisClient.quit();	
}

function pullUserNotification(targetUID,callback){
    var redisClient = redis.createClient(redis_port,redis_ip); 	
	redisClient.zcard('noti'+targetUID,function(err,data){
       console.log('pullUserNotification ZCARD',data);
    }) 
	
    redisClient.zrange('noti:'+targetUID,0,-1,function(err,data){
	     var n = 3;
	     var lists = _.groupBy(data, function(a, b){
                return Math.floor(b/n);
        });
        lists = _.toArray(lists); //Added this to convert the returned object to an array.
        console.log(lists);

        if(err) {  console.log('pullUserNotification'.red,data); callback(err,null);}
	    else { 
		   console.log('pullUserNotification noti count'.green,data);
		   callback(null,data);
        }		  
	})
	redisClient.quit();
}

function removeNewUserNotification(targetUID,callback){

    var redisClient = redis.createClient(redis_port,redis_ip); 
    redisClient.zremrangebyrank('noti:'+targetUID,0,-1,function(err,data){
	    console.log('removeNewUserNotification romve ',data);
	})

	
	redisClient.get('noti:'+targetUID+':count',function(err,len){
       console.log('removeNewUserNotification get count',len);
	   redisClient.decrby('noti:'+targetUID+':count',len,function(err,data){
          console.log('remove count:',data);	   
	      redisClient.quit();
		  
		 if(err) {  console.log('removeNewUserNotification'.red,data); callback(err,null);}
	     else { 
		   console.log('removeNewUserNotification noti count'.green,data);
		   callback(null,data);
         }
		 
	   })
    })
	
	
}



exports.pushUserNotification = pushUserNotification;
exports.pullUserNotification = pullUserNotification;
exports.pullUserNotificationCount = pullUserNotificationCount;
