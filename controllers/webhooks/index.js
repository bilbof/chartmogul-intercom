/*

Webhook processor for Intercom webhooks. Data arrives from /routes/index.js

Relevant documentation:
- https://docs.intercom.com/integrations/webhooks

*/

var Q = require('q');
var assert = require('assert');
var database = require('../database');
var unirest = require('unirest');
var credentials;
var importer;

var webhooks = function(source){
	assert(source, "data_source required");
	credentials = source;

	importer = require('../importer')(source.token, source.key);
};

webhooks.prototype.processWebhook = function(webhook){
	
	return new Promise(function(resolve, reject){
		assert(webhook, "webhook required");
		assert(webhook.type, "notification_event", "webhook.type must be notification_event");

		console.info("Webhook: %s. Time: %s. ID: %s. Source: %s.", webhook.topic, webhook.created_at, webhook.id, credentials.token);	

		switch(webhook.topic){
			case "user.created":
			case "user.unsubscribed":
			case "user.email.updated":
			case "contact.created":
			case "contact.signed_up":
			case "contact.added_email":
				importer.importUserAttributesAndTags([webhook.data.item])
				.then(resolve)
				.catch(reject);
				break;
			case "user.tag.deleted":
			case "user.tag.created":				
				importer.updateTag(webhook.data.item, webhook.topic)
				.then(resolve)
				.catch(reject);
				break;
			case "ping":
				resolve("pong!");
				break;
			default:
				resolve("No action taken on webhook: " + webhook);
				break;
		}
	})
}

webhooks.prototype.subscribe = function(auth){
	assert(auth,"auth required to subscribe to webhooks");

	return new Promise(function(resolve, reject){
		
		unirest.post('https://api.intercom.io/subscriptions')
		.auth({
			user: auth.intercom.token,
			pass: auth.intercom.key
		})
		.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
		.send({
		  "service_type": "web",
		  "topics": ["UserTag", "Lead", "user"],
		  "url": "https://chartmogul-intercom.herokuapp.com/webhooks/"+auth.chartmogul.token
		})
		.end(function (response) {
			resolve(response.body);
		});
	});
}

module.exports = function (source) {
	return new webhooks(source);
};
