//https://github.com/leotse/ces2013-server
//https://github.com/aprudnikovas/node.sample.blog/blob/ec27ad760404a1b11f0a4e2c2f17c5621e914aca/services/gridfs.js
//https://github.com/aprudnikovas/node.sample.blog/blob/ec27ad760404a1b11f0a4e2c2f17c5621e914aca/routes/file.js
//https://github.com/coreyrecvlohe/node-facebook-login-system/blob/master/models/users.js#L78
//https://github.com/sheadley/imagemobile/blob/37d766fc8d07dc2901ee7ce2a1cab80efa5cb063/fileUpload.js

//https://github.com/astelixoose/iris_recognition/blob/master/app.js
//https://github.com/diogogmt/sobol/blob/4bf7b1bf99ee1edbd78a0550c056aa2d1cdb99a3/app.js
//https://github.com/diogogmt/sobol/blob/4bf7b1bf99ee1edbd78a0550c056aa2d1cdb99a3/routes/media.js
//https://github.com/rbl/common_js/blob/628a7f296ca2c4583eb5f57d52302ee641967e0a/extMongoose.js


/*
https://github.com/motherjones/newsquiz
https://github.com/brycebaril/mchx-recruiting/blob/28383f9b099ff5507dcd643abb6feec17274be68/node/quiz.js
https://github.com/cGuille/RealTimeQuiz
https://github.com/cloudcollab/Cloud-Service-for-Shared-Screens-/blob/master/Quiz/quiz.js
https://github.com/ecarter/quizshow/blob/master/app.js
https://github.com/advptr/mento/blob/master/mento-server.js
*/

(function() {
	mongoose = require("mongoose");
	request = require("request");
	GridStore = mongoose.mongo.GridStore;
	Grid = mongoose.mongo.Grid;
	ObjectID = mongoose.mongo.BSONPure.ObjectID;

    exports.delete = function(id, fn) {
        var db, store;
        db = mongoose.connection.db;
        id = new ObjectID(id);
        store = new GridStore(db, id, "r", {
            root: "fs"
        });
        return store.unlink(function(err, result) {
            if (err) {
                return fn(err);
            }
            return fn(null, result);
        });
    };
 	
	exports.get = function(id, fn) {
		var db, store;
		db = mongoose.connection.db;
		id = new ObjectID(id);
		store = new GridStore(db, id, "r", {
			root: 'fs'
		});
		return store.open(function(err, store) {
			if(err) {
				return fn(err);
			}
			if (("" + store.filename) === ("" + store.fileId) && store.metadata && store.metadata.filename) {
				store.filename = store.metadata.filename;
			}
			return fn(null, store);
		});
	};
	
	exports.existsFile = function(id,fn){
		var db, store;
		db = mongoose.connection.db;
		id = new ObjectID(id);	
		
	    GridStore.exist(db, id, function(error, result) {
            if(err) {
				return fn(err);
			}		
            return fn(null, result);
        });
	
	}

	exports.putFile = function(path, name, options, fn) {
		var db;
		db =  mongoose.connection.db;
		//options = parse(options);
		options.metadata = options.metadata || {};
		options.metadata.filename = name;
		var id = new ObjectID(); //id == name
		console.log('id:',id);
		return new GridStore(db, id,'w', options).open(function(err, file) {
			if(err) {
				return fn(err);
			}
			console.log('Trying to write: ',options , path);
			return file.writeFile(path, fn);
		});
	};
	
	exports.putFileWithID = function(path, id,name, options, fn) {
		var db;
		db =  mongoose.connection.db;
		options.metadata = options.metadata || {};
		options.metadata.filename = name;
		console.log('id:',id);
		return new GridStore(db, id,'w', options).open(function(err, file) {
			if(err) {
				return fn(err);
			}
			console.log('Trying to write: ',options , path);
			return file.writeFile(path, fn);
		});
	};

    exports.deleteByID = function(id, fn) {
        var db, store;
        db = mongoose.connection.db;
        store = new GridStore(db, id, "r", {
            root: "fs"
        });
        return store.unlink(function(err, result) {
            if (err) {
                return fn(err,null);
            }
            return fn(null, result);
        });
    };	

	parse = function(options) {
		var opts;
		opts = {};
		if (options.length > 0) {
			opts = options[0];
		}
		if (!opts.metadata) {
			opts.metadata = {};
		}
		return opts;
	};

}).call(this);