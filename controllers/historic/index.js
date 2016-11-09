/*

Historic data importer. Data arrives from /routes/index.js.

Relevant documentation:
- https://docs.intercom.com/integrations/

*/

var Q 		 = require('q');
var assert 	 = require('assert');
var unirest  = require('unirest');
var database = require('../database');
var importer;
var intercom_auth;

var historic = function(auth){
	assert(auth, "auth required");
	assert(auth.chartmogul, "ChartMogul token and key required");
	assert(auth.chartmogul.token, "ChartMogul token required");
	assert(auth.chartmogul.key, "ChartMogul key required");
	assert(auth.intercom, "Intercom token and key required");
	assert(auth.intercom.token, "Intercom token required");
	assert(auth.intercom.key, "Intercom key required");

	intercom_auth = auth.intercom;
	importer = require('../importer')(auth.chartmogul.token, auth.chartmogul.key);
	database.storeCredentials(auth.chartmogul);
};

function get(path, param){

	return new Promise(function(resolve, reject){
		var p = param ? path+"?scroll_param="+param : path;
		
		console.info('initiating get '+p);
		
		unirest.get('https://api.intercom.io'+p)
		.auth({
			user: intercom_auth.token,
			pass: intercom_auth.key
		})
		.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
		.send()
		.end(function (response) {
		  resolve(response.body);
		});

	});
}

function getAllUsers(){
	console.info('initiating getAllUsers');

	return new Promise(function(resolve, reject){
		
		var usersList = [];

		function getUsers(param){
			get('/users/scroll', param)
			.then(data =>{
				assert(data.type, "user.list", "Returned data type is not a user.list, check request.");
				
				usersList = usersList.concat(data.users);

				console.log("Fetching users from intercom: "+usersList.length);

				if (data.scroll_param && data.users.length){ getUsers(data.scroll_param); }
				else { resolve(usersList); }
			})
			.catch(reject)
		}

		getUsers(null);
	});
}

historic.prototype.import = function(){
	console.info('initiating historic.import');

	return new Promise(function(resolve, reject){
		getAllUsers()
		.then(importer.importUserAttributesAndTags)
		.then(resolve)
		.catch(reject);
	});
}

module.exports = function (auth) {
	return new historic(auth);
};
