function displayError(error){
	var err = document.getElementById('error');

	if (error === "clear") { err.textContent = ""; }
	else if (error) {
		err.textContent = error;
	}
	else {
		err.textContent = "Please complete the form.";
	}
}

function webhook(token){

	displayError("Importing data...");
	
	var s = "https://app.intercom.io/a/apps/"+document.getElementById('int-token').value+"/settings/webhooks";
	var subdomain = document.getElementById('subdomain');
	subdomain.textContent = s;
	subdomain.href = s;
		
	document.getElementById('url').textContent = "https://chartmogul-intercom.herokuapp.com/webhooks/"+token;
	document.getElementById('historic').style.display = "none";
	document.getElementById('webhook').style.display = "block";
}

function sendData(d){
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			displayError(xhr.responseText);
			displayError("Data Imported.");

		}
		else if (xhr.status >= 400) {
			displayError("Importing data...");
		}
	};

	xhr.open('POST', '/import');
	
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify(d));
		
	webhook(d.chartmogul.token);
}

function importData(e) {
	e.preventDefault();
	
	displayError("Validating...");

	var formErrors = 0;

	var packet = {
		"chartmogul": {
			"token": document.getElementById('cm-token').value,
			"key": document.getElementById('cm-key').value
		},
		"intercom": {
			"token": document.getElementById('int-token').value,
			"key": document.getElementById('int-key').value
		}
	};

	var p = Object.keys(packet);

	for (var j = 0; j<2; j++) {
		var d = packet[p[j]];
		
		if (d) {
			if (typeof d === "object") {
				var k = Object.keys(d);
				for (var a = 0; a < k.length; a++) {
					var m = d[k[a]];
					
					if (!m) {
						formErrors++;
						displayError(m);
					}
					else if (m.length < 2) {
						formErrors++;
						displayError("'" + m + "' is not valid");
					}
				}
			}
		}
		else {
			formErrors++;
		}
	}

	formErrors ? false : sendData(packet);
}

function updateImportStatus(data_source){
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			
			var status = JSON.parse(xhr.responseText);

			console.info(status);
			
			document.getElementById('status').textContent = status.message;

			if (status.state != "import_complete"){
				setTimeout(function(){
					updateImportStatus(data_source);
				}, 3000);
			}
		}
	};

	xhr.open('GET', '/sources/'+data_source+'/status');
	
	xhr.setRequestHeader("Content-Type", "application/json");
	
	xhr.send();
}




