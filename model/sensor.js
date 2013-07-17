var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test',function(err,data){
	if(err) console.log('database  error');
	else console.log("database linked",data);
});

var Schema = mongoose.Schema;

var MoteSchema = new Schema({
	/**/
	identity:{
		mac:String,
		factory_id:String
	},
	 
	manufacturer:{
		name:String,
		date:Date
	},
	battery:{
		storage:Number
	},
	sensors:{
		  type: [String] 
	},
	/////////////////////////////////////////////////
	protocol:{
		ipv6:String
	},
	software:{
		date:Date,
		version:String
	},
	location:{
		geo:[Number,Number],
		park_post:Number,
		street_name:String,
		deployment_date:Date
	},
	mode:{ type:String,  enum: ['maintaince', 'test', 'deployment'], default: 'deployment'},
	alive: Boolean,
	update_time: Date
});

var sensorSchema = new Schema({
	id:{type:String, index:{unique:true}},
	type:String,
	attributes:[{
		name:String,
		unit:String
	}]
});


var firmwareSchema = new Schema({
	description:String,
	version:String,
	software:Buffer
});

var sensorDataSchema = new Schema({
	time:Date,   // timestamp
});

var MoteModel = mongoose.model('mote',MoteSchema);
var SensorModel = mongoose.model('sensor',sensorSchema);
var SensorDataModel = mongoose.model('sensor_data',sensorDataSchema);


/**********************************************************************
 * 
 * 
 *                     basic sensor info
 *                     
 *                      Id [mac, factory id],  Manufacturer[who, date], Sensors [ type], Battery[year, storage], Software[date, version]
 
 * 
 *  $gt like this: var now = new Date(); var fiveminago = new Date(now.getTime() - 5*60*1000); then query with {date : {$gt:fiveminago}} 
 *  db.posts.find( //query today up to tonight
  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
 * 
 **********************************************************************/        




function getSensorCount(query,callback){
	console.log('getSensorCount');
	MoteModel.count(query,function(err,data){
		if(err) callback(err,null);
		else{
			callback(null,data);
		}
	})
}

function importSensorInfo(sensors, callback){
	console.log('importSensorInfo ');
	MoteModel.create(sensors,function(err,data){
		if(err) callback(err,null);
		else{
			
			callback(null,data);
		}
	})
}

function updateSensorInfo(sensors,newValues, callback){
	MoteModel.update(sensors,newValues,function(err,data){
		if(err) callback(err,null);
		else{
			callback(null,data);
		}
	})
}

function deleteSensorInfo(query, callback){
	MoteModel.remove(query,function(err,data){
		if(err) callback(err,null);
		else{
			callback(null,data);
		}
	})
}

function getSensorInfo(query,option,callback){
    console.log('getSensorInfo');
	MoteModel.find(query,option,function(err,data){
		if(err) callback(err,null);
		else{
			callback(null,data);
		}
	})
}

function getOneSensorInfo(query,callback){
    console.log('getOneSensorInfo');
	MoteModel.find(query,function(err,data){
		if(err) callback(err,null);
		else{
			callback(null,data);
		}
	})	
}


/**************************************************************
 * 
 *              more info in the deployment
 *                   
 * 
 **************************************************************/
function deployMote(location,mode){
	
}


/**************************************************************
 * 
 *              routine info
 *                   
 * 
 **************************************************************/
function updatePing(){
	// alive , last update timestamp
	// ipv6 or gateway
}




exports.getSensorCount = getSensorCount;
exports.importSensorInfo = importSensorInfo;
exports.getSensorInfo = getSensorInfo;
exports.deleteSensorInfo = deleteSensorInfo;
exports.getOneSensorInfo = getOneSensorInfo;
