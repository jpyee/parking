var app = require('../app').app;
var GridFS = require('../app').GridFS

var userModel = require('../model/user_model');
var followModel = require('../model/follow_model');
var config = require('../conf/config.js');
var	gridfs = require("./gridfs");

var crypto = require('crypto');
var fs = require('fs');

var moment = require('moment');
require('colors');
var async = require('async');
var check = require('validator').check,
    sanitize = require('validator').sanitize;
	
var util = require("util");//, mime = require("mime");
var im = require('imagemagick');
var Hashids = require("hashids"),
    hashids = new Hashids("this is my salt");
	
var notification_api = require('./notification_api');

// Middleware  moderators  admin
var requireLogin = function(role) {
  return function(req, res, next) {
    if(req.session.uid){
		next();
	}else{
	    res.redirect('/login');
	}	
  }
};
	
app.get('/follow/:id',getFollowers);
app.post('/follow/:id',requireLogin(''),followPeople);
app.del('/follow/:id',requireLogin(''),notFollowPeople);

function getFollowers(req,res,next){
   console.log('getFollowers',req.params.id);
   req.send(200);
}

function followPeople(req,res,next){
     console.log('followPeople',req.session.uid,req.params.id,req.body.follow);	 
	 var follow = sanitize(req.body.follow).toInt(); 	 
	 try {
         check(follow, 'Please enter a valid integer').notNull().isInt();
     } catch (e) {
         console.log(e.message); //Please enter a valid integer
     }
	 if(follow ==0)
     {
	    async.parallel([
	        function(callback) {
	            followModel.follow(req.session.uid,req.params.id,function(err,data){
	                if(err){console.log('follow err');callback();}
                    else{
					   console.log('follow success'.green,data);
					   callback();
					}					
	            });			
		    },
		    function(callback) {
	            followModel.isfollowedBy(req.params.id,req.session.uid,function(err,data){
	                if(err){console.log('followed err');callback();}
                    else{
					   console.log('is followed success'.green,data);
					   
					   notification_api.pushUserNotification(req.params.id,req.session.uid,'follows','you');
					   
					   callback();
					}	       
	            });			  		
		    }],function(err) {
	            if (err) {
		            console.log(err);
		             next(err);
			        return;
                }	
                res.send(200,{'follow':1});
		  
	    });		   
	 }
     else{	 
	    async.parallel([
	        function(callback) {
	            followModel.unfollow(req.session.uid,req.params.id,function(err,data){
	                if(err){console.log('unfollowerr');callback();}
                    else{
					   console.log('unfollow success'.green,data);
					   callback();
					}	       
	            });				
		    },
		    function(callback) {
	            followModel.isUnfollowedBy(req.params.id,req.session.uid,function(err,data){
	                if(err){console.log('isUnfollowedBy err');callback();}
                    else{
					   console.log('isUnfollowedBy success'.green,data);
					   callback();
					}	       
	            });			  		
		    }],function(err) {
	            if (err) {
		            console.log(err);
		            next(err);
			        return;
                }	
                res.send(200,{'follow':0});		  
	    });	
     }

 
}

function notFollowPeople(req,res,next){
   console.log('notFollowPeople',req.params.id);
   req.send(200);
}

app.get('/profile/:id/follower',getFollower);
app.get('/profile/:id/following',getFollowing);

function getFollower(req,res,next){
    followModel.getFollowedList(req.params.id,function(err,data){
	    if(err){console.log('getFollowedList err');next(err);}
        else{
			console.log('isUnfollowedBy success'.green,data);
			res.send(data);
		}	
	})	
}

//https://localhost/profile/519985ed86e35aec15000001/following
function getFollowing(req,res,next){
    followModel.getFollowList(req.params.id,function(err,data){
	    if(err){console.log('getFollowedList err',err);next(err);}
        else{
			console.log('isUnfollowedBy success'.green,data);
			res.send(data);
		}	
	})
}

