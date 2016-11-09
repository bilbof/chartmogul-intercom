/*

Importer. Takes Intercom data Data arrives from "../historic" or "../webhooks".

Relevant documentation:
- https://docs.intercom.com/integrations/

*/

var Q		   = require('q');
var assert 	   = require('assert');
var chartmogul = require('chartmogul-node');
var identifier;
var config;

var importer = function(token, key){
	assert(token, "chartmogul token required");
	assert(key, "chartmogul key required");

	identifier = token;
	config = new chartmogul.Config(token, key);
};

importer.prototype.addTags = function(user){
	assert(config, 'ChartMogul.Config class must be defined');
	assert(user, "intercom user object required to addTags");
	assert(user.email, "intercom user.email required to addTags");
	
	// console.info('initiating addTags for %s', user.email);
	
	return new Promise(function(resolve, reject){
		if (user.tags.tags.length){
			var tags = [];

			user.tags.tags.forEach(function(tag){
				tags.push("intercom_"+tag.name);
			})

			chartmogul.Enrichment.Tag.add(config, {
				"email": user.email,
				"tags": tags
			})
			.then(resolve)
			.catch(reject)
		}
		else { resolve(user.email); }
	})
};

importer.prototype.addAttributes = function(user){
	assert(config, 'ChartMogul.Config class must be defined');
	assert(user, "intercom user object required to addAttributes");
	assert(user.email, "intercom user.email required to addAttributes");
	
	// console.info('initiating addAttributes for %s', user.email);

	return new Promise(function(resolve, reject){

		var attributes = [];

		for (var key in user.custom_attributes) {
		   	
			var obj = user.custom_attributes[key];
			// capitalising first char
			var type = (typeof obj).charAt(0).toUpperCase() + (typeof obj).slice(1);
			// 'Integer', not 'Number'
			if (type === "Number"){ type = 'Integer'; }
			// Intercom stores dates in unix timestamp format and timestamp attribute names end with "_at"
			if (key.substr(key.length-3, key.length) === "_at") { type = "Timestamp" }	
			if (type === "Timestamp"){ obj = new Date(obj*1000).toISOString(); }

			attributes.push({
				"key": "intercom_"+key,
				"value": obj,
				"type": type
			});
		}

		if (attributes.length){
			chartmogul.Enrichment.CustomAttribute.add(config, {
				"email": user.email,
				"custom": attributes
			})
			.then(resolve)
			.catch(resolve)
		}
		else { resolve(user.email); }
	})
};

importer.prototype.updateTag = function(notification, type){
	assert(notification, "user required to updateTag");
	assert(notification.type, "user_tag", "user_tag type required to updateTag");
	assert(notification.user.email, "notification.user.email required to updateTag");

	console.info('initiating updateTag');

	/*
	{
	  "type": "user_tag",
	  "created_at": 1392731331,
	  "tag" : {
	      "id": "17513",
	      "name": "independent",
	      "type": "tag"
	    },
	  "user" : {
	      "type": "user",
	      "id": "530370b477ad7120001d",
	      "user_id": "25"
	  }
	}
	*/

	return new Promise(function(resolve, reject){

		switch(type){
			case "user.tag.created":
				chartmogul.Enrichment.Tag.add(config, {
					"email": notification.user.email,
					"tags": ["intercom_"+notification.tag.name]
				})
				.then(resolve)
				.catch(resolve);
				break;
			case "user.tag.deleted":
				chartmogul.Enrichment.Customer.search(config, {
				  email: notification.user.email
				})
				.then(data =>{
					chartmogul.Enrichment.Tag.remove(config, data.entries[0].uuid, {
						"tags": ["intercom_"+notification.tag.name]
					})
					.then(resolve)
					.catch(reject);
				})
				.catch(resolve);
				break;
			default:
				resolve("No action taken on webhook: " + notification);
				break;
		}
		
	});
}

importer.prototype.importUserAttributesAndTags = function(users){
	assert(users, "users list required to importUserAttributesAndTags");

	console.info('initiating importUserAttributesAndTags');
 
	return new Promise(function(resolve, reject){

	    var i = 0;
	    rateLimit();

	    function rateLimit() {
	        if (i < users.length -1) {

	        	console.info("%s tagging_etc %s", identifier, users[i].email)

	        	importer.prototype.addTags(users[i]);
	        	importer.prototype.addAttributes(users[i]);
	            i++;
	            setTimeout(rateLimit, 400);
	        }
	        else { resolve("Imported all attributes and tags"); }
	    }

	});
}

module.exports = function (token, key) {
	return new importer(token, key);
};
