var app = require('../app').app;
var GridFS = require('../app').GridFS

var permissionAPI = require('./permission_api');

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
	
var followModel = require('../model/follow_model');
		
var util = require("util");//, mime = require("mime");
var im = require('imagemagick');



//app.get('/',authUser,homePage);
app.get('/',homePage);
/**
  update the profile
*/
// personal home page
app.get('/profile/:username',permissionAPI.authUser,getDashboardPage);
// dashboard
app.get('/settings/dashboard',permissionAPI.authUser,getDashboardPage);
// profile page
app.get('/settings/profile',permissionAPI.authUser,getProfileSettingPage);
app.put('/settings/profile',permissionAPI.authUser,updateUserProfile);
app.post('/settings/profile/image',permissionAPI.authUser,updateUserImageToGridfs);
app.get('/settings/profile/image',permissionAPI.authUser,getUserImageFromGrids);
app.get('/images/:id',getImageFromGrids);
// account page
app.get('/settings/account',permissionAPI.authUser,getAccountSettingPage);
app.put('/settings/account',permissionAPI.authUser,updateUserAccount);
app.del('/settings/account',permissionAPI.authUser,deleteUserAccount);
// social page
app.get('/settings/social',permissionAPI.authUser,getSoicalSettingPage);
app.put('/settings/social',permissionAPI.authUser,updateUserSoical);
app.del('/settings/social',permissionAPI.authUser,deleteUserSoical);
// notification page
app.get('/settings/notification',permissionAPI.authUser,getNotificationPage);
app.put('/settings/notification',permissionAPI.authUser,updateUserNotification);

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

function getDashboardPage(req,res,next){
    var locals = {};	
    var skip = (req.query["s"])?req.query["s"]:0, limit = (req.query["l"])?req.query["l"]:10, option = {'skip':skip,'limit':limit};

	async.series([
	    function(callback) {			
		        console.log('retrieve Dashboard page'.green, req.session.username,req.session.uid);
		        userModel.findUserById(req.session.uid,function(err,user){
		            if(err) {
			            console.log('user uid not found'.red);
		            }
			        else{
			            console.log('find user uid'.green,user._id);
                        locals.user = {
                           username: user.username,
					       email: user.email,
						   img: user.img,
						   about:user.about,
						   cdate:user.cdate,
						   id:user._id
                        };					
                    }
                    callback();					
		        })			
		},
	    function(callback) {			
		        console.log('retrieve Dashboard page'.green, req.params.username);
		        userModel.findUserByQuery({'username':req.params.username},function(err,user){
		            if(err) {
			            console.log('user uid not found'.red);
		            }
			        else{
			            console.log('find user uid'.green,user._id);
                        locals.puser = {
                           username: user.username,
					       email: user.email,
						   img: user.img,
						   about:user.about,
						   cdate:user.cdate,
						   id:user._id
                        };					
                    }
                    callback();					
		        })			
		},
		function(callback) {  //{'tutor.id':{'$in':req.session.uid}
		    console.log('getin follow list'.red,req.session.uid,locals.user.id);
            followModel.inFollowList(req.session.uid,locals.puser.id.toString(),function(err,data){
                if(err) next(err);
	            else{
		            console.log('get user in follow list'.green,data);
					if(data!=null){
						locals.user.follow = 1;
					}
		        }
                 callback();				
            })

		}],function(err) {
	      if (err) return next(err); 
		  locals.title = 'My Dashboard';
		  res.render('dashboard', locals);
	});	

}

/********************************************************

                   PROFILE
				
*********************************************************/
function getProfileSettingPage(req,res,next){
    var locals = {};
	 if (req.session.uid) {
		 console.log('retrieve getProfileSettingPage '.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err) {
			    console.log('user uid not found'.red);
			    res.render('signin');
		    }
			else{
			   console.log('find user uid'.green,user._id);
                locals.user = {
			        username : user.username,
			        email : user.email,
			        about: user.about,
			        location:user.loc,
			        fullname:user.fullname,
			        email:user.email,
					img: user.img
                };
               locals.title = 'Profile Setting';				
			   res.render('setting_profile',locals);
            }			
		 })
	}else{	
	    res.redirect('/login');
	}
}

function updateUserProfile(req,res,next){
   console.log(req.body.email);
   var update = new Object();
   if(req.body.email)  {      
       update.email = sanitize(req.body.email).trim(), update.email = sanitize(update.email).xss();  
	        try {
               check(update.email).isEmail();
              } catch (e) {
                   res.statusCode = 400;
                   res.end(JSON.stringify({status:"error", errors:[{"message":"email is invalid"}]}));      
                   return;
            }	   
   }
   if(req.body.location)   {   update.loc = sanitize(req.body.location).trim(), update.loc = sanitize(update.loc).xss();  }
   if(req.body.fullname)  {   update.fullname = sanitize(req.body.fullname).trim(), update.fullname = sanitize(update.fullname).xss();  }
   if(req.body.about)   {   update.about = sanitize(req.body.about).trim(), update.about = sanitize(update.about).xss();  }
   update = JSON.stringify(update);
      
   userModel.updateUser({'_id':req.session.uid},{'$set':{'email':req.body.email,'loc':req.body.location,'fullname':req.body.fullname
                                                         ,'about':req.body.about}},function(err,data){
      if(err) next(err);
	  else{
	    console.log('update success'.green, data,req.url);
		res.redirect(req.url);
	  }	  
   })

}

function updateUserImageToFolder(req,res,next){
//http://stackoverflow.com/questions/9844564/render-image-stored-in-mongo-gridfs-with-node-jade-express?rq=1
//https://github.com/cianclarke/node-gallery/tree/master/views
//http://stackoverflow.com/questions/3709391/node-js-base64-encode-a-downloaded-image-for-use-in-data-uri 
//http://pastebin.com/Gt1EWVWr  request iamge icon based64
//http://stackoverflow.com/questions/8110294/nodejs-base64-image-encoding-decoding-not-quite-working

	console.log('updateUserImageToFolder'.green,req.files.image.path);
	var tem_path = req.files.image.path;	
	
	var target_path = './public/useruploads/'+req.files.image.name;
	console.log(target_path);	
	fs.rename(tem_path,target_path,function(err){
		if(err) { res.send(err); next(err);}	
		else{	
			fs.readFile(target_path, "binary", function(error, file) {
			    if(error) {
			      res.writeHead(500, {"Content-Type": "text/plain"});
			      res.write(error + "\n");
			      res.end();
			    } else {
				  var base64data = new Buffer(file).toString('base64');
				  var imagesrc = util.format("data:%s;base64,%s", 'image/jpg', base64data);
				  //console.log(imagesrc);
				  //res.send('<img src="'+imagesrc+'"/>');
				  				  
			      res.writeHead(200, {"Content-Type": "image/png"});
			      res.write(file, "binary");
			    }
			})
		}				
	})	
}
// http://stackoverflow.com/questions/8110294/nodejs-base64-image-encoding-decoding-not-quite-working
function updateUserImageToGridfs(req,res,next){
	var file = req.files.image;
	console.log('updateUserImageToMongo'.green,file.path,file.type,file.size);
	
	if (req.session.uid) {
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err) {
			    console.log('user uid not found'.red);
				next(err);
				return;
		    }
			else{
			    console.log('find user uid'.green,user._id,user.salt);
                var	fileHash = crypto.createHash('md5').update(file.path + '' + (new Date()).getTime()).digest('hex');
	            var newFileName = (fileHash + file.type);
				
				if(user.img){
				    console.log('old image is ',user.img);
				    gridfs.deleteByID(user.img,function(err,result){					
					    if(err) next(err)
						else console.log('delete the old image'.green,user.img);
					})
				}
/*				
	im.resize({
        srcPath: file.path,
        dstPath: 'lala.jpg',
        width: 32,
        height: 32,
        quality: 1
    }, function(err, stdout, stderr) {
         console.log('stdout'.green,stdout);
         console.log('stderr'.green,stderr);
         console.log('error'.red,err);
		 
		fs.unlink(file.path,function (err) {
            if (err) throw err;
            console.log('successfully deleted /tmp/hello');
        });
		fs.unlink('lala.jpg',function (err) {
            if (err) throw err;
            console.log('successfully deleted lala.jpg');
        });
    });				
*/				
				gridfs.putFileWithID(file.path, newFileName, newFileName, {'content_type':file.type,'chunk_size':file.size,metadata: { "id": user._id}}, function(err1, result) {
                    
				    fs.unlink(file.path,function (err) {
                        if (err) throw err;
                        console.log('successfully deleted'.green,file.path);
                    });
					
					if(err) return next(err1);
					
					console.log('save image into gridid'.green,result._id,newFileName);
					user.img = result._id;
					user.save(function (err2) {
                            if (err) return next(err2); 
							else console.log('save user image',user.password,user.salt);
			                res.redirect("/settings/profile");
                    });
				})
            }			
		 })
	}	
}

function getUserImageFromGrids(req,res,next){
    console.log('getUserImageFromGrids');
	if (req.session.uid) {
		userModel.findUserById(req.session.uid,function(err,user){
		    if(err || !user) {
			    console.log('user uid not found'.red);
				next(err);
				return;
		    }			
			
			if(user.img){
			   console.log('old image is ',user.img);
			   gridfs.get(user.img, function(err, file) {
				    res.header("Content-Type",  file.contentType);  //'application/octet-stream'
				    res.header("Content-Disposition", "attachment; filename=" + file.filename);
				    res.header('Content-Length', file.length);
				    return file.stream(true).pipe(res);
			    });			   
			}else{			
			   res.send(404,{'error':'image not found'});
			}			
        })
	}   
}

//http://stackoverflow.com/questions/9844564/render-image-stored-in-mongo-gridfs-with-node-jade-express?rq=1
//http://stackoverflow.com/questions/10550300/gridfs-product-images-thumbnails-what-is-the-best-db-sctructure
function getImageFromGrids(req,res,next){
    if(req.params.id ==null)
	    return 	res.send(404,{'error':'image not found'});
	if(req.params.id == undefined){
	
	   console.log('id undenfined');
	   res.send(404,{'error':'image not found'});
	   return;
	}	
	console.log('getImageFromGrids ',req.params.id);
	gridfs.get(req.params.id, function(err, file) {
	    if(err)  return res.send(404,{'error':'image not found'});
		res.header("Content-Type",  file.contentType);  //'application/octet-stream'
		res.header("Content-Disposition", "attachment; filename=" + file.filename);
		res.header('Content-Length', file.length);
				    return file.stream(true).pipe(res);
	});	
}


//http://cnodejs.org/topic/4f939c84407edba2143c12f7
// https://github.com/MarshalW/BackBoneDemo/blob/master/app.js
function upload64(req, res,next){
    var imgData = req.body.imgData;
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    fs.writeFile("out.png", dataBuffer, function(err) {
        if(err){
          res.send(err);
        }else{
          res.send("±£´æ³É¹¦£¡");
        }
    });
}


/********************************************************

                   ACCOUNT
				
*********************************************************/
function getAccountSettingPage(req,res,next){
     var locals = {};
	 if (req.session.uid) {
		 console.log('retrieve getProfileSettingPage '.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err) {
			    console.log('user uid not found'.red);
			    res.render('signin');
		    }
			else{
			   console.log('find user uid'.green,user._id);
               locals.user = {
                    username: user.username,
					email: user.email,
					img:user.img
               };
               locals.title = 'Account Setting';			   
			   res.render('setting_account',locals);
            }			
		 })
	 }else{	
	    res.redirect('/login');
	}
}

function updateUserAccount(req,res,next){
   console.log(req.body.email,req.body.old_password,req.body.new_password);
   var update = new Object();
   
   if(req.body.email)  {      
       update.email = sanitize(req.body.email).trim(), update.email = sanitize(update.email).xss();  
	        try {
               check(update.email).isEmail();
              } catch (e) {
                   res.statusCode = 400;
                   res.end(JSON.stringify({status:"error", errors:[{"message":"email is invalid"}]}));      
                   return;
            }	   
   }   
   
   
   update = JSON.stringify(update);
   
   userModel.updateUser({'_id':req.session.uid},{'$set':{'email':req.body.email}},function(err,data){
      if(err) return next(err);
	  else{
	    console.log('update success'.green, data);
		res.redirect('/');
	  }	  
   })
}

function deleteUserAccount(req,res,next){
   console.log('delete user account');
   userModel.deleteUserById( req.session.uid ,function(err,data){
      if(err) return next(err);
	  else{
	    console.log('delete success'.green);
		res.redirect('/');
	  }	  
   })
}

/********************************************************

                   SOCIAL
				
*********************************************************/

function getSoicalSettingPage(req,res,next){
     var locals = {};
	 if (req.session.uid) {
		 console.log('retrieve getSoicalSettingPage '.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err) {
			    console.log('user uid not found'.red);
			    res.render('signin');
		    }
			else{
			   console.log('find user uid'.green,user._id);
               locals.user = {
                    username: user.username,
					email: user.email,
					img: user.img
               };
               locals.title = 'Social Setting';			   			   
			   res.render('setting_social',locals);
            }			
		 })
	 }else{	
	    res.redirect('/login');
	}
}

function deleteUserSoical(req,res,next){
   console.log('delete user account');
   userModel.deleteUserById( mongoose.Types.ObjectId(req.session.uid) ,function(err,data){
      if(err) next(err);
	  else{
	    console.log('delete success'.green);
		res.redirect('/');
	  }	  
   })
}

/***************************************************************************************************
 missing
***************************************************************************************************/
function updateUserSoical(req,res,next){
   var update = new Object();
   if(req.body.email)  update.email=req.body.email;
   update = JSON.stringify(update);
   
   console.log(req.body.email,req.body.old_password,req.body.new_password);
   userModel.updateUser({'_id':req.session.uid},{'$set':{'email':req.body.email}},function(err,data){
      if(err) next(err);
	  else{
	    console.log('update success'.green, data);
		res.redirect('/');
	  }	  
   })  
}				

/********************************************************

                   NOTIFICATION
				
*********************************************************/
function getNotificationPage(req,res,next){
     var locals = {};
	 if (req.session.uid) {
		 console.log('NotificationPage,found session '.green, req.session.username,req.session.uid);
		 userModel.findUserById(req.session.uid,function(err,user){
		    if(err) {
			    console.log('user uid not found'.red);
			    res.render('signin');
		    }
			else{
			   console.log('find user uid'.green,user._id);
               locals.user = {
                    username: user.username,
					email: user.email,
					img:user.img
               };
               locals.title = 'Notification Setting';			   			   
			   res.render('setting_notification',locals);
            }			
		 })
	}else{	
	    res.redirect('/login');
	}
}
/***************************************************************************************************
                                    missing
***************************************************************************************************/
function updateUserNotification(req,res,next){
   var update = new Object();
   if(req.body.email)  update.email=req.body.email;
   update = JSON.stringify(update);
   
   console.log(req.body.email,req.body.old_password,req.body.new_password);
   userModel.updateUser({'_id':req.session.uid},{'$set':{'email':req.body.email}},function(err,data){
      if(err) next(err);
	  else{
	    console.log('update success'.green, data);
		res.redirect('/');
	  }	  
   })  
}	



function getPersonalPage(req,res,next){
    var locals = {};
    var username = req.params.username;
    console.log('username '.green); 
	userModel.findUserByQuery({'username':username},function(err,user){
		    if(err) {
			    console.log('user uid not found'.red);
				next(err);
		    }
			else{
			   console.log('find user uid'.green,user._id);
               locals.user = {
                    username: user.username,
					email: user.email,
					img:user.img
               };				
			   res.render('setting_account',locals);
            }			
	})    
}