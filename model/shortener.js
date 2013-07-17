(function() {
	mongoose = require("mongoose");
	request = require("request");
	GridStore = mongoose.mongo.GridStore;
	Grid = mongoose.mongo.Grid;
	ObjectID = mongoose.mongo.BSONPure.ObjectID;
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	CodeSchema = new Schema({
		'shortCode' : String,
		'mongoId' : String
	});

	Code = mongoose.model('ShortCodes', CodeSchema);

	exports.generate = function(objId, callback) {
		var test = new Code({a:'test'});
		var shortCode = getFreeCode(function(id) {
			var c = new Code({shortCode:id, mongoId:objId});
			c.save(function(err) {
				callback(id);
			});
		});
	};

	exports.getId = function(id, callback) {
		Code.find({shortCode:id}, function(err, docs) {
			if(docs.length > 0) {
				var id = docs[0].mongoId;
				callback(id);
			}
			else callback(null);
		});
	};

	getFreeCode = function(callback) {
		var block = false;
		var tryId = generateRandom();
		Code.find({shortCode:tryId}, function(err, docs) {
			if(docs.length > 0) {
				getFreeCode(callback);
			}
			else{
				callback(tryId);
			}
		});
	};

	generateRandom = function() {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < 6; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

}).call(this);