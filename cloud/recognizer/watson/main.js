// IBM Watson image recognition

var request = require('request');

console.log("*************************watson loaded");

function getTags(imageURL, imageID, completion) {
	try {
		console.log("********************************1");
		request.get({ url: imageURL, encoding: null }, function(err, res, body){
				console.log("******************************** GOT IMAGE");

			var req = request.post({
				auth: {
					user: '738d4720-4a4e-4df4-80e9-721602ed1a72',
					pass: '2lgDXFABO35I',
					sendImmediately: true
				},
				url: 'https://gateway.watsonplatform.net/visual-recognition-beta/api/v2/classify?version=2015-12-02',
				method: 'POST',
				},
				function(error2, res2, body2) {
						console.log("******************************** WATSONE RESPONSE");
					if (!error2) {
					  console.log("Watson API success: " + JSON.stringify(body));
					  var response = JSON.parse(body);
					  completion(null, [ { classes: [_.map(response.images.scores, function(a) { return a.name })] } ]);
					}
					else
						completion([{ classes: [] }]);
				}
			);
			var form = req.form();
			form.append('images_file', body, {
				filename: "poppoIR",
				contentType: res.headers['content-type']
			});
		});
  	}
  	catch (e) {
		console.log("******************************** ERROR");
		console.error(e);
  	}
}
