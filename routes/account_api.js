var app = require('../app').app;
var GridFS = require('../app').GridFS

var userModel = require('../model/user_model');
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

var permissionAPI = require('./permission_api');
// session

// drop the database 
// mongoose.connection.db.executeDbCommand({dropDatabase:1});




app.get('/',homePage);

function homePage(req,res){
    var locals = {};	
    var skip = (req.query["s"])?req.query["s"]:0, limit = (req.query["l"])?req.query["l"]:10, option = {'skip':skip,'limit':limit};

	async.parallel([
	    function(callback) {
	       if (req.session.uid) {
		        console.log('retrieve homePage'.green, req.session.username,req.session.uid);
		        userModel.findUserById(req.session.uid,function(err,user){
		            if(err) {
			            console.log('user uid not found'.red);
		            }
			        else{
			            console.log('find user uid'.green,user._id);
                        locals.user = {
                           username: user.username,
					       email: user.email,
						   img: user.img
                        };					
                    }
                    callback();					
		        })
	        }else{
                    callback();	
            }			
		}],function(err) {
	      if (err) {
		    console.log(err);
		    next(err);
			return;
          }				   
		  res.render('home', locals);
	});	 
	
}

/** 
 *   sign up
 */
app.get('/signup',signupPage);
app.post('/signup',signupUser);
/**   
 *     get the login and logout
 */
app.get('/login',loginPage);
app.post('/sessions',loginUser);
app.del('/sessions', logoutUser);

app.post('/users/validate/username/', validateName);
app.post('/users/validate/email/', validateEmail);

app.post('/sessionsMobile',loginUserMobile);


function validateName(req, res,next){
    result = '';
    var username = req.param('username');
    var user_id = req.param('user_id');
    if (username) {
      userModel.findUserByQuery({_id: {$ne: user_id},username: username}, function (error, user) {
        if (error) {
          console.error(error);
		  next(error);
        }
        if (user) {
          result = 'false';
        }
        else {
          result = 'true';
        }
        res.send(result);
      });
    }
    else {
      result = 'false';
      res.send(result);
    }
}

function validateEmail(req, res){
    result = '';
    var email = req.param('email');
	
    try {
       new_email = req.param('email');
       check(new_email).isEmail();
    } catch (e) {
       res.statusCode = 400;
       res.end(JSON.stringify({status:"error",errors:[{"message":"email is invalid"}]}));
       return;
    }	
	
    var user_id = req.param('user_id');
    if (email) {
      userModel.findUserByQuery({_id: {$ne: user_id}, username: {$ne: null},email: email}, function (error, user) {
        if (error) {
          console.error(error);
		  next(error);
        }	  
        if (user) {
          result = 'false';
        }
        else {
          result = 'true';
        }
        res.send(result);
      });
    }
    else {
      result = 'false';
      res.send(result);
    }
}



function signupPage(req,res){
    var locals = {};
	if (req.session.uid) {
		 console.log('signupPage,found session '.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err || !user) {
			    console.log('user uid not found'.red);
                locals.title = 'Sign Up';			   			   				
			    res.render('signup',locals);
		    }
			else{
			   console.log('find user uid'.green,user._id);
                locals.user = {
                    username : user.username,
					email : user.email
                };
				
			    res.redirect('/',locals);
            }			
		 })
	 } else {
		console.log('signupPage,not found session'.red);
		locals.title = 'Sign Up';
	    res.render('signup',locals);
	 }
}

function loginPage(req,res){
    var locals = {};
	 if (req.session.uid) {
		 console.log('loginPage, found session'.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err || !user) {
			    console.log('user uid not found'.red);
                locals.title = 'Sign In';				
			    res.render('signin',locals);
		    }
			else{
			   console.log('find user uid'.green,user._id);
                locals.user = {
                    username : user.username, 
					email : user.email
                };
			    //res.render('setting_account',locals);
				res.redirect('/');
            }			
		 })
	 } else {
		 console.log('loginPage,not found session'.red);
         locals.title = 'Sign In';			   			   						 
	     res.render('signin',locals);
	 }
}
function signupUser(req,res,next){

    console.log('post  /signup  ',req.body.username,req.body.email,req.body.password);	
	
	var errors = [];
    if (!req.body.username) errors.push("username specified")
    if (!req.body.email) errors.push("Missing email")
    if (!req.body.password) errors.push("Missing password")
    if (errors.length){
        res.statusCode = 400;
        res.end(JSON.stringify({status:"error", errors:errors}));      
        return;    
	}	

	if (req.body.password.length < 6) {
       res.statusCode = 400;
       res.end(JSON.stringify({status:"error", errors:[{"message":"password must be at least 6 characters long"}]}));          
       return;
    }
	
    if(req.body.email)  {      
       var email = sanitize(req.body.email).trim(), email = sanitize(email).xss();  
	        try {
               check(email).isEmail();
              } catch (e) {
                   res.statusCode = 400;
                   res.end(JSON.stringify({status:"error", errors:[{"message":"email is invalid"}]}));      
                   return;
            }	   
    }	
		
    userModel.createNewUser({'username':req.body.username,'email':req.body.email,'password':req.body.password},function(err,data){
	    if(err) {
		    console.log('err',err);
			return next(err);
	    }
	    else
		{
		    /*
	        followModel.createFollow({'_id':data._id},function(err,data){
	            if(err){console.log('follow err');}
                else{
					console.log('create follow success'.green,data);
					
				}					
	        });
            */			
		    console.log("signup success".green, data);
		    req.session.uid = data._id;
            req.session.username = data.username;
		    res.redirect('/');		   
		}
	});	

}

function loginUserMobile(req,res,next){

    if (!req.body.username) {
        res.json("username must be specified ", 400);
        return;
    } 

    if (!req.body.password) {
        res.json("password must be specified ", 400);
        return;
    } 		

	console.log('loginUser '.green,req.body.username,req.body.email,req.body.password,req.body.remember_me);	
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {	
	    //  
                                
	    userModel.authenticateFromPass(username,password,function(err,data){
		  if(err){
		     console.error(err);
			 res.json('fail');
		  }else{
		     console.log(data.username,req.body.remember_me,data._id);
			 //if(req.session) console.log('req session  ');
			 //else console.log('session == null',req);
             req.session.uid = data._id;
             req.session.username = data.username;
			  	 
			 res.json('success');
             
		  }
		
		})   

	}

}

function loginUser(req, res, next) {
    if (!req.body.username) {
        res.json("username must be specified ", 400);
        return;
    } 

    if (!req.body.password) {
        res.json("password must be specified ", 400);
        return;
    } 		

	console.log('loginUser '.green,req.body.username,req.body.email,req.body.password,req.body.remember_me);	
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {	
	    //  
                                
	    userModel.authenticateFromPass(username,password,function(err,data){
		  if(err){
		     console.error(err);
			 res.redirect('/login');
		  }else{
		     console.log(data.username,req.body.remember_me,data._id);
			 //if(req.session) console.log('req session  ');
			 //else console.log('session == null',req);
             req.session.uid = data._id;
             req.session.username = data.username;
			 
             if (req.body.remember_me) {
			   /*
               //http://dailyjs.com/2011/01/10/node-tutorial-9/
			   //http://cnodejs.org/topic/515535485dff253b374288da
			   //http://www.80sec.com/session-hijackin.html
			   //http://stackoverflow.com/questions/5879132/sharing-data-between-php-and-node-js-via-cookie-securely
			   //http://stackoverflow.com/questions/11897965/what-are-signed-cookies-in-connect-expressjs
			   //https://hacks.mozilla.org/2012/12/using-secure-client-side-sessions-to-build-simple-and-scalable-node-js-applications-a-node-js-holiday-season-part-3/
			   */
			   
			   userModel.generateCookieToken(data.email,function(err,token){
			       if(err) return next(err);
			       else{
				        console.log('generateCookieToken ',token.email,token.token,token.series);
				        // res.cookie('logintoken', {email:data.email,token:data.token,series:data.series}, { expires: new Date(Date.now() + 2 * 60480000), path: '/' });
				   }
			   });
			   
			   var signed_uid = permissionAPI.cipherSessionParameter(data._id,config.sessionSecret);
			   var signed_auth = permissionAPI.cipherSessionParameter(username+','+password,config.sessionSecret);
			   
               res.cookie('usernanme', data.username, { expires: new Date(Date.now() + 900000), httpOnly: true });
               res.cookie('ip',req.ip, { expires: new Date(Date.now() + 900000), httpOnly: true });
               res.cookie('last_login',new Date().getTime(), { expires: new Date(Date.now() + 900000), httpOnly: true });			   
               res.cookie('auth',signed_auth, { expires: new Date(Date.now() + 900000), httpOnly: true });
               res.cookie('uid', signed_uid, { expires: new Date(Date.now() + 900000), httpOnly: true });
			   res.cookie('rememberme', 'yes', { expires: new Date(Date.now() + 900000), httpOnly: true });
		   
             } 	 
			 
      // Regenerate session when signing in
      // to prevent fixation 
	  /*      */
      req.session.regenerate(function(){
        // Store the user's primary key 
        // in the session store to be retrieved,
        // or in this case the entire user object
		console.log('');
        req.session.uid = data._id;
        req.session.username = data.username;
		res.redirect('/');
      });
             
		  }
		
		})   

	}
}
/**/
function logoutUser(req, res){
  // Logout by clearing the session
    console.log('logoutUser    '.green);
	if (req.session) {
        req.session.uid = null;
        req.session.username = null;
        res.clearCookie('uid');
		res.clearCookie('auth');
		res.clearCookie('logintoken');
		res.clearCookie('usernanme');
		res.clearCookie('ip');
		res.clearCookie('last_login');
		
        res.clearCookie('gadm');
        req.session.destroy(function () {
		    console.log('session destoried'.green);
        });
    }
    /*	
    req.session.regenerate(function(err){
    // Generate a new csrf token so the user can login again
    // This is pretty hacky, connect.csrf isn't built for rest
    // I will probably release a restful csrf module
        csrf.generate(req, res, function () {
           res.send({auth: false, _csrf: req.session._csrf});    
        });	
   });
   */   
   res.redirect(req.headers.referer || '/login');
}


/****************************************************
                       password

*******************************************************/
app.get('/forgot-password', function(req, res, next){
    res.render('users/forgot-password', {
      title: 'Forgot Password',
      passwordSent: req.query.passwordSent,
      password: '',
      error: req.query.error
    });
});

app.post('/forgot-password', function(req, res, next){
    email = req.param('email');
    if (email) {
      userModel.findUserByQuery({email: email}, function (error, user) {
        if (user && user.password) {
          var name = user.name;
          var oldPasswordHash =  encodeURIComponent(user.password);
          var userId = user._id;
          var resetLink = siteInfo.site_url + "/reset-password/?userId="+userId+"&verify="+oldPasswordHash; 
          var resetMessage = "Hi " + name + "!<br /> Click to reset your password: <a href=\"" + resetLink + "\">" + resetLink + "</a>!";
          var resetMessagePlain = "Hi " + name + "! Go to this address to reset your password: " + resetLink;

		  /*
          server.send({
            text:    resetMessagePlain, 
            from: 'Management <' + siteInfo.site_email  + '>',
            to: email,
            subject: 'Password Reset',
            attachment: 
            [ {data:resetMessage, alternative:true} ]
          }, function(err, message) { console.log(err || message); })
          */
          res.redirect('/forgot-password/?passwordSent=true');
        }
        else {
          res.redirect('/forgot-password/?error=AccountNotFound');
        }
      });
    }
    else {
      res.redirect('/forgot-password/?error=NoEmailGiven');
    }
});

app.get('/reset-password',  function(req, res, next){
    var userId = req.query.userId;
    var verify = decodeURIComponent(req.query.verify);
    if (userId && verify) {
      userModel.findUserByQuery({_id: parseInt(userId)}, function (error, user) {
        if (user && user.password == verify) {
          resetPassword(userId, function (error, result) {
            if (error) {
              log.error(error);
              res.redirect('/forgot-password/?error=CouldNotReset');
            }
            else {
              res.render('users/forgot-password', {
                title: 'Password Reset',
                passwordSent: '',
                password: result,
                error:'' 
              });
            }
          });
        }
        else {
          res.redirect('/forgot-password/?error=CouldNotFindUser');
        }
      });
    }
    else {
      res.redirect('/forgot-password/?error=noUserIdOrVerify');
    }
});










/**
 *    sessions
 */
/**
function getAuth(req,res,next){
	  // This checks the current users auth
	console.log('get session  ....................................');
	  // It runs before Backbones router is started
	  // we should return a csrf token for Backbone to use
	if(typeof req.session.username !== 'undefined' && req.session.uid){
		
		  more hash authentication	 
		  userModel.findOneUser({'_id':req.session.uid}, function(err, user) {
			      if (user) {			      
			        next();
			      } else {
			        res.redirect('/sessions/new');
			      }
	     });
		 
	    res.send({auth: true, id: req.session.id, username: req.session.username, _csrf: req.session._csrf});
	  } 
	  else if (req.cookies.logintoken) {
		  userModel.authenticateFromToken(req);	  
	  } 
	  else {
	    res.send({auth: false, _csrf: req.session._csrf});
	    //	    res.redirect('/sessions/new');
	  }	
}


function isUserAdmin(user) {
  // Set admin
  var isAdmin = false;

  return isAdmin;
}

function createUserSession(req, res, user, next) {
  var isAdmin = false;
  // Create session
  req.session.user = {username:user.username, isAdmin:isAdmin, id:user._id, language:user.language, roles:user.roles};
  req.session.save(function (err) {
    next(err);
  });
}




app.post('/lost-password',forgetPassport);




app.get('/forgot', function (req, res, next) {
    if (req.session.uid) {
        res.redirect('/dashboard');
    } else {
        res.render('forgot', { "csrf":req.session._csrf, "message":req.flash('info') });
    }
});

//password reset //


function forgetPassport(req, res){

	        var email = req.body.email, name = req.body.name;
	        console.log(email+"    "+name);
// look up the user's account via their email //
			EM.dispatchResetPasswordLink({email:email,name:name}, function(e, m){
			// this callback takes a moment to return //
			// should add an ajax loader to give user feedback //
				if (!e) {
					res.send('ok', 200);
					console.log('send mail success');
				}	else{
					res.send('email-server-error', 400);
					for (k in e) console.log('error : ', k, e[k]);
				}
			});	
}

function isGlobalAdmin(req) {
    return (req.session.gadm);
}


*/


