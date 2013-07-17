var mongoose = require("mongoose")
    , GridStore = mongoose.mongo.GridStore
    , ObjectID = mongoose.mongo.BSONPure.ObjectID;
	
var im = require('imagemagick'),fs = require('fs');	
var moment = require('moment');		
var app = require('../app').app;
var	gridfs = require("./gridfs");

var async = require('async');
require('colors');
var check = require('validator').check,
    sanitize = require('validator').sanitize;
var crypto = require('crypto');	
var account_api = require('./account_api');


var Hashids = require("hashids"),
    hashids = new Hashids("this is my salt");

var userModel = require('../model/user_model');
/*
https://github.com/lefthand/Node-JS-Bootstrap/blob/master/lib/admin.js
https://github.com/QLeelulu/copy_work/blob/470e006d253c6bccbd451f1e0f1f31d08931ad20/controllers/admin_users.js
exports.admin_users = function(fnNext){
    var _t = this;
    userModel.find({isAdmin:true}).toArray(function(err, users){
        fnNext( _t.ar.view({'users': users}) );
    });
};
*/

// Middleware  moderators  admin
var requireRole = function(role) {
  return function(req, res, next) {
    if(req.session.uid){
	    console.log('requireRole',req.ip);
		next();
	}else{
	    res.redirect('/login');
	}	
  }
};

app.get('/admin/users', requireRole('admin'), function(req, res){
    var locals = {};	
    var skip = (req.query["s"])?req.query["s"]:0, limit = (req.query["l"])?req.query["l"]:10, option = {'skip':skip,'limit':limit};
	var name = req.query['n'];
    var name = (name)?{'username': { $regex: new RegExp(name, "i")}}:{};
	console.log('after regexp',name);
	async.parallel([
	    function(callback) {		
		        console.log('retrieve admin user page'.green, req.session.username,req.session.uid);
		        userModel.findUsers(name,option,function(err,users){
		            if(err) {
			            console.log('user uid not found'.red);
		            }
			        else{
			            console.log('find users'.green,users.length);
                        locals.users = users;	
                    }
                    callback();					
		        })
		
		}],function(err) {
	        if (err) return next(err);
            if(req.xhr){
			    res.send(locals.users);
				/*
				res.send(200,[
                        {value: 'item1'},
                        {value: 'item2'},
                        {value: 'item3'}
                    ]);
                */					
 			    return;
			}
			
		    locals.title = 'Admin - User';
			locals.page = 'users';			
		    res.render('admin/admin_user', locals);
	    });	
});

app.put('/admin/users/:id')

app.del('/admin/users/:id', requireRole('admin'), function(req, res, next){
    var locals = {};
    console.log('admin  del'.green, req.params.id);	
	async.parallel([
	    function(callback) {		
		        /**/
		        userModel.deleteUserById(req.params.id,function(err,user){
		            if(err) {
			            console.log('user uid not found'.red);
						locals.error = 'user not found';
		            }
			        else{
			            console.log('del user'.green,user);
                        locals.user = user;	
                    }
                    			
		        })				
                callback();						
		}],function(err) {
	        if (err) return next(err);

            if(req.xhr){
			    res.send(locals.user);
 			    return;
			}
			else
            res.redirect('/admin/users'); 			
	    });	
});

app.put('/admin/users/:id', requireRole('admin'), function(req, res, next){
    var locals = {};
    console.log('admin  put'.green, req.params.id,req.body.role);	
	async.parallel([
	    function(callback) {
            /*	            */	
			if(req.body.role=="none"){
			    userModel.updateUser({'_id':req.params.id},{'$unset':{'admin':1}},function(err,data){                                                                  
                    if(err) next(err);
	                else{
	                    console.log('remove admin success'.green, data,req.url, data.admin);	
	                }	  
                })			
			}
            else {   
			    userModel.updateUser({'_id':req.params.id},{'$set':{'admin':req.body.role}},function(err,data){                                                                  
                    if(err) next(err);
	                else{
	                    console.log('add admin success'.green, data,req.url, data.admin);	
	                }	  
                })
            }
            callback();			
		}],function(err) {
	        if (err) return next(err);

            if(req.xhr){
			    res.send(locals.user);
 			    return;
			}
			else
            res.redirect('/admin/users'); 			
	    });	
});


