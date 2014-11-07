
var querystring = require('querystring');
var https = require('https');

module.exports.postJSON = function( data, host, port, path, callback ){

      var data_json = JSON.stringify(data);

      var post_options = {
          host: host,
          port: port,
          path: path,
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': data_json.length
          }
      };

      // Set up the request
      var post_req = https.request(post_options, function(res) {
          res.setEncoding('utf8');
          var response = '';
          res.on('data', function (chunk) {
              response += chunk;
          });
          res.on('end', function() {
              console.debug( "Post Sent" );
              var obj;
              if( response.length > 0 ){
                try {
                    obj = JSON.parse(response);
                } catch( e ) {
                    console.debug( e );
                }
              }
              callback( null, { "response" : obj ? obj : response,
                                "status" : res.statusCode } );
          });
      });
      post_req.on('error', function(e) {
          console.debug( "Post Failed: " + e );
          callback( e , null );
      });

      // post the data
      post_req.write(data_json);
      post_req.end();
};
