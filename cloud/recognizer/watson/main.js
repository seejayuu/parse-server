// IBM Watson image recognition



/*
var watson = require('watson-developer-cloud');

var visualRecognition = watson.visual_recognition({
  version: 'v2-beta',
  username: '738d4720-4a4e-4df4-80e9-721602ed1a72',
  password: '2lgDXFABO35I',
  version_date:'2015-12-02'
});
*/

function getTags(imageURL, imageID, completion) {
	request.get({ url: imageURL, encoding: null }, function(err, res, body){
		var req = request.post({
			auth: {
				user: 738d4720-4a4e-4df4-80e9-721602ed1a72,
				pass: 2lgDXFABO35I,
				sendImmediately: true
			},
			url: 'https://gateway.watsonplatform.net/visual-recognition-beta/api/v2/classify?version=2015-12-02',
			method: 'POST',
			},
			function(error2, res2, body2) {
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
		form.append('images_file', toBuffer(file.data), {
			filename: "poppoIR",
			contentType: res.headers['content-type']
		});
	});
  
}
