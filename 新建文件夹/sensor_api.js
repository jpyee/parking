/***************************************************************************
 * 
 * 
 *                ADMIN 'S BASIC INTERFACE TO THE SENSOR PLATFORM
 * 
 *  
 **************************************************************************/
var sensorAPI = require('../model/sensor');
var app = require('../app').app;
/*****************************************************************************
 *          admin's authentication of the app
 ****************************************************************************/

function checkAuth(next){
	if(true)
	next();
}

/******************************************************************************
 *    upload the sensor list
 ******************************************************************************/
// upload the file list of motes
app.post('/motes/test/upload',function(req,res){
	
	console.log('post --  /motes/test/upload');
	var sensors = [{'manufacturer':{'name':'TI'}}];
	sensorAPI.importSensorInfo(sensors,function(err,data){
		if(err) console.log('err on import sensor info');
		else{
			console.log(data);
			sensorAPI.getSensorCount({},function(err,data){
				if(err) console.log('err get sensor count');
				else{
					console.log('sensor count  '+data);
				}
			})
		}
	})
	
})

// http://localhost:8080/madd
app.get('/madd',function(req,res){
	
	console.log('get --  /motes/test/upload');
	var sensors = [{'manufacturer':{'name':'TI','date':new Date()},'sensors':['humidity','temperature','light'],'identity':{'mac':'XDKJFAKJAL','factory_id':'TI 5555'},'software':{'version':'2.03','date':new Date()}},
		           {'manufacturer':{'name':'TI','date':new Date()},'sensors':['humidity','temperature','light'],'identity':{'mac':'XDKJFAKJAL','factory_id':'TI 5555'},'software':{'version':'2.03','date':new Date()}
	                ,'location':{'park_post':1,'geo':[25,35],'street_name':'coublet ','deployment_date':new Date()}, 'alive':true, 'update_time':new Date() }];
	
	sensorAPI.importSensorInfo(sensors,function(err,data){
		if(err) console.log('err on import sensor info');
		else{
			console.log(data);
			
			sensorAPI.getSensorCount({},function(err,data){
				if(err) console.log('err get sensor count');
				else{
					console.log('sensor count  '+data);
				}
			});
			
			sensorAPI.getSensorInfo({},function(err,data){
				if(err) console.log('get sensor info');
				else{
					console.log('  '+data);
					res.send(data);
				}
			})
		}
	})
	/**/
	
})

//http://localhost:8080/mremove
app.get('/mremove',function(req,res){
	
	console.log('get --  /motes/test/remove');
	var sensors = {};
	
	sensorAPI.deleteSensorInfo(sensors,function(err,data){
		if(err) console.log('err on import sensor info');
		else{
			console.log(data);
			sensorAPI.getSensorCount({},function(err,data){
				if(err) console.log('err get sensor count');
				else{
					console.log('sensor count  '+data);
				}
			});
			
			sensorAPI.getSensorInfo({},function(err,data){
				if(err) console.log('get sensor info');
				else{
					console.log('  '+data);
				}
			})
		}
	})
	/**/
	res.send('0');	
})



//http://localhost:8080/test/remove
app.delete('/test/remove',function(req,res){
	
	console.log('delete --   /motes/test/remove');
	
	res.send('/test/remove');	
})



// get motes in one region

//http://localhost:8080/motes/info?lon=23&lat=22&dist=2399&firmware_version=2.3.2&sensors=humidity,temperature&alive=true


// get motes whose location is near geo, max distance  http://localhost:8080/motes/info?lon=23&lat=22&maxDis=2399
// query   get motes whose firmware.version >           http://localhost:8080/motes/info?firmware_version=2.3.2
// query   get motes whose manufactuer.name == , in []
// query   get motes whose sensor type in []            http://localhost:8080/motes/info?sensors=humidity,temperature
// query   get motes whose mode is in [testament, maintaince, running] 
// query   get motes who is alive or dead since time    http://localhost:8080/motes/info?alive=true
app.get('/motes/info',function(req,res){
	
	console.log('get --   /motes/info');	
	console.log(req.query.lat+" "+req.query.lon+"  "+req.query.dist+"  "+req.query.firmware_version+ "  "+req.query.sensors+"  "+req.query.alive);
		
	// http://localhost:8080/motes/info?lon=35.111&lat=25.11&dist=2399&sensors=humidity,temperature&alive=true
	//get motes whose location is in []                         //,
	sensorAPI.getSensorInfo({'alive':req.query.alive,'location.geo' : { '$near' : [req.query.lat, req.query.lon]}},function(err,data){
		if(err) res.send(err);
		else{
			console.log(data);
			res.send(data);
		}
	})
	
	sensorAPI.getSensorInfo({'alive':req.query.alive,'sensors' : { '$in' : req.query.sensors.split(',')}},function(err,data){
		if(err) res.send(err);
		else{
			console.log(data);
			res.send(data);
		}
	})	
		
	
	//res.send('/motes/info');	
})

// get Info of one mote
// http://localhost:8080/motes/50a4cbcc9a16a61c16000005/info
app.get('/motes/:id/info',function(req,res){
	
	console.log('get --   /motes/:id/info   '+req.params.id);
	/*
	console.log(req.query.factory_id+"   "req.query.mac+ "   "+req.query.id);
	var query ;
	if(req.query.factory_id!=null)
	query = "{'factory_id':"+req.query.factory_id+"}";
	else if(req.query.mac!=null)
	query = "{'mac':"+req.query.mac+"}";
	else 
	query = "{'_id':"+req.query.id+"}";
    */
	
	var query = "{'_id':"+req.params.id+"}";
	sensorAPI.getOneSensorInfo(query,function(err,data){
		if(err) res.send(err);
		else{
			console.log(data);
			res.send(data);
		}		
	})
	
	//res.send('/motes/:id/info');	
})

// update the sensor mode
app.post('/motes/:id/deploy',function(req,res){
	
	// geo location, park post, 
	console.log('post --   /motes/:id/deploy');
	res.send('post --   /motes/:id/deploy');	
})

// 
app.put('/motes/:id/info',function(req,res){
	// update the geo location, park post, mode
	console.log('put --   /motes/:id/info');
	res.send('put --   /motes/:id/info');
})

app.delete('/motes/:id/info',checkAuth, function(req,res){
	
	// when delete the mote, we still keep its history, data are linked to the parkpost,geo location.
	console.log('delete --   /motes/:id/info');
	res.send('delete --   /motes/:id/info');
})


/***************************************************************************
 *  firmware repository 
 **************************************************************************/
// get firmwares in the firmware repository
app.get('/motes/firmware',function(req,res){
	console.log('get --   /motes/firmware');
	res.send('get --   /motes/firmware');
	
})
// get the firmware to download
app.get('/motes/firmware/:version/download',checkAuth,function(req,res){
	console.log('get --   /motes/firmware/:version/download');
	
	res.send('get --   /motes/firmware/:version/download');
})

// post the firmware
app.post('/motes/firmware',function(req,res){
	console.log('post --   /motes/firmware');
	
	res.send('get --   /motes/firmware/:version/download');
})

// 
app.put('/motes/firmware/:version',function(req,res){
	console.log('put --   /motes/firmware/:version');
	
	res.send('get --   /motes/firmware/:version/download');
})


app.delete('/motes/firmware/:version',function(req,res){
	console.log('delete --   /motes/firmware/:version');
	
	res.send('/motes/firmware/:version');
})

/***************************************************************************
 *  admin's cmd to install, update, get the firmware information for the mote 
 **************************************************************************/
// update the firmware on a group of motes
app.put('/motes/firmware/update',function(req,res){
	
	// update the firmware
	// updateFirmware(motes,firmware);
	console.log('put --   /motes/firmware/update');
})