var express = require('express');
var assert = require('assert');
var router = express.Router();
var database = require('../controllers/database');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'ChartMogul & Intercom integration' });
});

// Imports Intercom and Chartmogul credentials, begins historic import, and provides webhook.
router.post('/import', function(req, res){

	console.info('router.post/import')
	console.log(req.body);

	if (req.body){
		var auth = req.body;
		var historic = require('../controllers/historic')(auth);
		
		res.status(200).send("Historic import in progress");


		historic.import(auth)
		.then(data =>{
			
			console.info("%s historic_import complete", auth.chartmogul.token);

		})
		.catch(err =>{ res.status(400).send({message: err, data: req.body}) });
	}
	else { res.status(400).send({message:"bad request", data: req.body}) }
});

// Imports Intercom webhook data into ChartMogul
router.post('/webhooks/:token', function(req, res){
	if (req.params.token && req.body){
		
		database.listOne(req.params.token)
		.then(auth =>{			
			var webhooks = require('../controllers/webhooks')(auth);

			webhooks.processWebhook(req.body)
			.then(response =>{
				return res.status(200).send({data: req.body, message: response});
			})
			.catch(err => {
				console.error("webhook error: " + err);

				return res.status(500).send({data: req.body, message: err});
			});

		})
		.catch(err => {
			console.error("unprocessable webhook, token not stored in db: " + err);
			return res.status(200).send({message: "Error: Intercom integration not set up with your account.", "data": req.body, "error": err});
		});
	}
	else {
		return res.status(400).send({message: "Need a ChartMogul token in the url e.g. /webhooks/asF21sldmoJq44amd", data: req.body});
	}
});

// Get status of a particular account integration
router.get('/:token/status', function(req, res){
	database.getStatus(req.params.token)
	.then(data =>{
		return res.status(200).send(data);
	})
	.catch(err =>{
		console.log(err);
		return res.status(404).send(err);
	});
});

module.exports = router;
