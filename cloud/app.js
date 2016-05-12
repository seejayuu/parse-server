// app.js
//
// created by Chris Williams
//
// the main URL dispatcher for poppo.com

var debug = true

var express = require('express');
//var app = express();		// now runs off the parse-server express instance
var http = require('http');
var mail = require('./Mailgun.js');
var bodyParser = require('body-parser');
var request = require('request');
var user = require('./util/user.js');

mail.initialize('sandbox4ba3cd71927a419db74f6a84e97973f6.mailgun.org', 'key-f7f17e392715c4328b9274a4557d08a5');

app.set('views', 'cloud/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

//////////////////////////////////////
// web home page
//////////////////////////////////////

app.get('/', function(request, response) {
	response.render('home', { id: "" });
});

app.use(express.static('public'));

//////////////////////////////////////
// Pingdom service monitoring
//////////////////////////////////////

app.get('/backendcheck', function(req, response) {
	request({
		url: "http://poppo.herokuapp.com/parse",
		headers: {
			"X-Parse-Application-Id": 'r0KegEx2R4IO1Bk8ajoS'
		},
		
	}, function (error, resp, data) {
		var status;
		var startTime = new Date();;
		if (error) {
			status = error;
		}
		else {
			status = "OK"
			console.log("Back end check: " + JSON.stringify(data));
		}
		response.render('backendcheck', {status: status, responseTime: new Date() - startTime});
	});
});

//////////////////////////////////////
// password reset
//////////////////////////////////////

app.post('/pwresetdone/:key', function(request, response) {
	Parse.Cloud.useMasterKey()
	var query = new Parse.Query('PasswordReset');
	query.equalTo("passwordResetToken", request.params.key)
	query.find({
		success: function(results) {
			var query = new Parse.Query('_User');
			query.equalTo("email", results[0].get("email"));
			query.find({
				success: function(users) {
					var user = users[0];
					user.set("password", request.body.password);
					user.save().then(
						function(user) {
							console.log("Password changed", user)
						},
						function(error) {
							console.log("Password change failed", error)
						}
					);
					console.log("Password=" + request.body.password)
				  	results[0].destroy({ success: function(obj) {
						response.render('message', { msg: "Your password has been reset" });
				  	}, error: function(obj, error) {} });
				}
			})
		}
	});
});

app.get('/passwordreset/:key', function(request, response) {
	var query = new Parse.Query('PasswordReset');
	query.equalTo("passwordResetToken", request.params.key)
	query.find( {
  		success: function(results) {
  		  if (results.length > 0) {
      	  	response.render('passwordreset', { key: request.params.key });
      		}
      		else {
      	  		response.render('message', { msg: "Password reset link no longer valid" });
      	  		console.error("Password reset key not found: " + request.params.key);
      	  	}
		},
  	error: function(object, error) {
      console.error(JSON.stringify(error));
		}
	});
});

//////////////////////////////////////
// notification via email or sms link
//////////////////////////////////////

app.get('/install/:userid', function(request, response) {
  response.render('install', {})
})

app.get('/install/:userid/:type/:contentid', function(request, response) {
	var userObj
	var userName
	var userPhoto
	function gotContent(content, imageField) {
	  trace ("gotcontent: " + content)
	  var title = content == null ? "This item has been deleted" : (content == "" ? "" : content.get("title"))
	  if (imageField == null)
	    title = ""
	  if (typeof title == 'undefined') 
	  	title = ""
	  var imageurl = content == null ? "/assets/empty-content.png" : content.get(imageField).url()
		response.render('install', { user: userName, userimageurl: userPhoto, what: request.params.type, imageurl: imageurl, title: title, launchparams: request.params.userid + "/" + request.params.type + "/" + request.params.contentid });
	}
	function gotPost(content) {
    gotContent(content, "itemImage")
	}
	function gotAlbumGroup(content) {
    gotContent(content, "backgroundImage")
	}
	function gotUser(user) {
	  var poppoLogoImage = "/assets/poppo-logo-disc-blue.png"
	  if (user != null) {
      userObj = user
      userName = user.get("name")
      if (typeof userName == "undefined")
        userName = user.get("username")
      try {
        userPhoto = user.get("profilePhoto").url()
      }
      catch (error) {
        userPhoto = null
      }
      if (userPhoto == null)
        userPhoto = poppoLogoImage
    }
    else {
      trace("Unknown user")
      userName = "An unknown user"
      userPhoto = poppoLogoImage
    }
    trace("Request: " + request.params.type)
    switch (request.params.type) {
      case "App":
        gotContent(null, null)
      case "Post":
      case "Photo":
        getPost(request.params.contentid, gotPost)
        break;
      case "Album":
      case "Group":
        getAlbumGroup(request.params.contentid, gotAlbumGroup)
        break;
    }
	}
	getUser(request.params.userid, gotUser)
});

//////////////////////////////////////
// web site user signup
//////////////////////////////////////

app.get('/join/:id', function(request, response) {
	response.render('home', { id: request.params.id });
});

app.post('/signup', function(request, res) {
  // test reCaptcha
  var params = {
    'response': request.body['g-recaptcha-response'],
    'secret': '6LefpRQTAAAAAOcwL0WtZgJX3fvD0mSZBstd16c4',
    'remoteip': request.connection.remoteAddress
  };

  Parse.Cloud.httpRequest({
    method: "POST",
    url: "https://www.google.com/recaptcha/api/siteverify",
    body: params,
  }).then(function(httpResponse) {
        if (httpResponse.data.success == true)
            sendEmail(request, res);
        else
          res.render('captchafailed', { });
      }, function(httpResponse) {
          res.error("Human validation failed");
  });
});


function sendEmail(request, response) {  
  // send email
  console.error("Send Email\n")
  var WebSignup = Parse.Object.extend("WebSignup");
  var webSignup = new WebSignup();
  webSignup.set("email", request.body.email)
  webSignup.set("referredBy", request.body.id)
  webSignup.save(null, {
    success: function(webSignup) {
      mail.sendEmail({
      to: "chris@poppo.com,mike@poppo.com",
      from: "website@poppo.com",
      subject: "Poppo launch notification request",
      text: "Entered email address: " + request.body.email
      }).then(function(httpResponse) {
        response.render('emailsent', { userid: webSignup.id });
      }, function(httpResponse) {
      console.error(httpResponse);
      response.error("Email send failed");
      });
    },
    error: function(webSignup, error) {
      // error.message
    }
  });
}

//////////////////////////////////////
// admin
//////////////////////////////////////

app.get('/admin/vM7ryfK7mUHGky9M', function(request, response) {
	response.render('admin', { });
});

app.get('/admin/post_write', function(request, response) {
	Parse.Cloud.useMasterKey()
	var Post = Parse.Object.extend("Post")
	var query = new Parse.Query(Post)
	query.limit(1000)	// TODO: Only works for the first 1000 posts at the moment. Need chunking
	query.find({
		success: function(results) {
			for (var i = 0; i < results.length; i++) {
				var postACL = new Parse.ACL();
				postACL.setPublicReadAccess(true);
				postACL.setPublicWriteAccess(true);
				results[i].setACL(postACL);
			}
  			var chunks = [], i = 0;
  			console.log("Results = " + results.length)
			while (i < results.length) {
    			chunks.push(results.slice(i, i += 100));
    		}
    		var count = 0;
    		console.log("Saving " + chunks.length+ " chunks")
			for (var i = 0; i < chunks.length; i++) {
				console.log("Saving chunk " + (i+1))
				Parse.Object.saveAll(chunks[i], {
					success: function(objs) {
						if (++count >= chunks.length)
							response.render('admindone', { msg: "Post permissions updated" });
					},
					error: function(error) {
					}
				})
			}
		},
		error: function(error) {
		}
	})
});

app.get('/admin/fix_counts', function(request, response) {
	Parse.Cloud.useMasterKey()
	response.render('admindone', { msg: "Not implemented" });
});

// scans all rows in a class and calls back for each one that was created by a deleted user
function scan(className, userFieldName, deleteFlag, callback) {
	var str = "";
	var classToScan = Parse.Object.extend(className);
	var query = new Parse.Query(classToScan);
	query.include(userFieldName);
	var count = 0;
	query.each(function(result) {
		if (typeof result.get(userFieldName) == 'undefined') {
		  count++
			str += result.id + "<br>";
			if (deleteFlag) {
        user.getObject(className, result.id, function(obj) {
          obj.destroy({
            success: function() {
              console.log("***deleted: " + result.id);
            },
            error: function() {
              console.log("***error***");
            }
          });
        });
			}
		}
	}).then(function() {callback("Class: " + className + "(" + count + ")<br>" + str + "<br>")}).catch(function() { callback("***ERROR***<br>")});
}

app.get('/admin/list_orphans', function(request, response) {
  scanOrphans(response, false);
});

function scanOrphans(response, deleteFlag) {
	var rowList = "";
	var count = 0;
	function accum(str) {
		rowList += str
		if (++count >= 7)
			response.render('admindone', { msg: rowList });
	}
	Parse.Cloud.useMasterKey();
	scan("Post", "createdBy", deleteFlag, accum);
	scan("Follow", "from", deleteFlag, accum);
	scan("Album", "createdBy", deleteFlag, accum);
	scan("Like", "createdBy", deleteFlag, accum);
	scan("Comment", "createdBy", deleteFlag, accum);
	scan("Notification", "from", deleteFlag, accum);
	scan("Log", "createdBy", deleteFlag, accum);
}

app.get('/admin/fix_orphans', function(request, response) {
  scanOrphans(response, true);	
});

//////////////////////////////////////
// utility
//////////////////////////////////////

function trace(msg) {
  if (debug)
    console.log(msg)
}

function getPost(postID, completionBlock) {
	getObject("Post", postID, completionBlock)
}

function getAlbumGroup(postID, completionBlock) {
	getObject("Album", postID, completionBlock)
}

function getUser(postID, completionBlock) {
	getObject("_User", postID, completionBlock)
}

function getObject(className, userID, completionBlock) {
	var User = Parse.Object.extend(className);
	var query = new Parse.Query(User);
  trace(className + "/" + userID)
	query.get(userID, {
  		success: function(user) {
  			completionBlock(user)
		},
  		error: function(object, error) {
  		  console.log(className + "/" + userID + ": " + JSON.stringify(error))
  		  completionBlock(null)
		}
	});
}

//app.listen(process.env.PORT || 8080);
