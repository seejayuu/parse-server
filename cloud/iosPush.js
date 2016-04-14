Parse.Cloud.define("iosPush", function(request, response) {

  // request has 2 parameters: params passed by the client and the authorized user                                                                                                                               
  var params = request.params;
  var user = request.user;
  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.equalTo('deviceType', 'ios'); // targeting iOS devices only                                                                                                                                          
  pushQuery.equalTo('user', params.toUser)
  delete params.toUser;
  
  console.log("**************** Push: " + JSON.stringify(params));
  
  Parse.Push.send({
    where: pushQuery, // Set our Installation query                                                                                                                                                              
    data: params
  }, { success: function() {
      console.log("#### PUSH OK");
  }, error: function(error) {
      console.log("#### PUSH ERROR" + error.message);
  }, useMasterKey: true});

  response.success('success');
});
