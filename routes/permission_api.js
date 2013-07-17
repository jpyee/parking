var moment = require('moment');
require('colors');
var async = require('async');
var check = require('validator').check,
    sanitize = require('validator').sanitize;
	
var crypto = require('crypto');
var config = require('../conf/config.js');
	
function authUser(req,res,next){

     var cookie_uid = req.cookies['uid'];
	 var cookie_auth =  req.cookies['auth'];
	 var signed_uid,signed_auth;
	 if(cookie_uid)
	 signed_uid = deciphterSessionParameter(cookie_uid,config.sessionSecret);
	 if(cookie_auth)
	 signed_auth = deciphterSessionParameter(cookie_auth,config.sessionSecret);


	 if (req.session.uid) {
		 console.log('authUser middleware'.green, req.session.username,req.session.uid);
		 /*
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err || !user) {
			    console.log('user uid not found'.red);
		        res.redirect('/login');
		    }
			else{			
			   console.log('authUser  find user uid'.green,user._id);			   
               res.cookie('usernanme', user.username, { expires: new Date(Date.now() + 900000), httpOnly: true });
               res.cookie('ip',req.ip, { expires: new Date(Date.now() + 900000), httpOnly: true });
               res.cookie('last_login',new Date().getTime(), { expires: new Date(Date.now() + 900000), httpOnly: true });
			   
			   next();
            }			
		 })
		 */
		 next();
	 } else {
		 console.log('retrieve login page  not uid'.red,'go to login page');
		 res.redirect('/login');
	 }
}

/*******************************************************
              client session
*******************************************************/

function cipherSessionParameter(str,secret){
   var password = secret, str = str;
   //console.log('cipherSessionId',uid,password);
   var cipher = crypto.createCipher("rc4", password);
   var ciphered = cipher.update(str.toString(), "utf8", "hex");
   ciphered += cipher.final("hex");
   //console.log('ciphered£º' + ciphered);
   return ciphered;
}

function deciphterSessionParameter(str,secret){
   var password = secret, str = str;
   var decipher = crypto.createDecipher("rc4", password);
   var deciphered = decipher.update(str.toString(), "hex", "utf8");
   deciphered += decipher.final("utf8");
   //console.log('deciphered£º' + deciphered);
   return deciphered;
}


exports.authUser = authUser;
exports.cipherSessionParameter = cipherSessionParameter;
exports.deciphterSessionParameter =deciphterSessionParameter;