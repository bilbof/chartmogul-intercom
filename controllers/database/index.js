// functions for interacting with database
var	MongoClient = require('mongodb').MongoClient;
var assert 		= require('assert');
var dbURL 		= ""; // need to add your own here
var mongo;

function database(){};

database.prototype.connect = function(callback) {
	if (mongo === undefined) {
		MongoClient.connect(dbURL, function(err, db) {
			if(err) { return callback(err) };
			mongo = db;
			callback(null, mongo);
		});
	}
	else {
		callback(null, mongo);
	}
}

database.prototype.storeCredentials = function(credentials){
	assert(credentials, 'credentials required to storeCredentials');
	
	console.info('intitiating storeCredentials')
	console.log(credentials);
	
	return new Promise(function(resolve, reject){

		database.prototype.connect(function(err, db){
			if (err) { reject(err); }
			
			var collection = db.collection('sources');

			collection.insertOne(credentials, function(err, result) {
				assert.equal(err, null);
				assert.equal(1, result.result.n);
				assert.equal(1, result.ops.length);
				resolve(result);
			});
		});
	});
}

database.prototype.listOne = function(token) {
	assert(token, "need a ChartMogul token");

	console.info('intitiating listOne')

	return new Promise(function(resolve, reject){
		database.prototype.connect(function(err, db) {
		  if (err) { reject(err); }

		  	var collection = db.collection('sources');
		  	
		  	collection.findOne({token: token}, function(error, source) {
		  	    if (error) { reject(error); }
		  	    resolve(source);
		  	});
		  	
		});	
	})
	
};

database.prototype.getStatus = function(token){
	assert(token, "need a ChartMogul token");

	console.info('intitiating getStatus')

	return new Promise(function(resolve, reject){
		database.prototype.connect(function(err, db) {
			if (err) { reject({"error":err, "message": "Couldn't connect to MongoClient"}); }

			var collection = db.collection('sources');
		  	
			collection.findOne({token: token}, function(error, source) {
				if (error) { reject({"error":error, "message": "Couldn't find record."}); }
				resolve({"token": source.token, "webhook_url": "https://chartmogul-intercom.herokuapp.com/webhooks/"+source.token});
			});
		});	
	})
}

module.exports = new database();