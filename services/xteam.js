var Joi = require('joi');
module.exports = {
  method: 'POST',
  path: '/slack/xteam/{team}/{service}/{token}',
  handler: function (request, reply) {
      var querystring = require('querystring');
      var https = require('https');

      var app = request.server.settings.app;

      var text = request.payload.text;
      if( request.payload.trigger_word )
      {
          text = request.payload.text.replace(request.payload.trigger_word, '').trim();
      }


      var data = {
          "username": request.payload.user_name,
          "text": text,
          "color" : "#3333FF",
          "user_id" : request.payload.user_id
      };

      var data_json = JSON.stringify(data);

      // An object of options to indicate where to post to
      var post_options = {
          host: app.xteam.host,
          port: '443',
          path: app.xteam.path + '/' + request.params.team + '/' + request.params.service + '/' + request.params.token ,
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': data_json.length
          }
      };

      // Set up the request
      var post_req = https.request(post_options, function(res) {
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
              console.log('Response: ' + chunk);
          });
          res.on('end', function() {
              reply( { "text" : "" } );
          });
      });
      post_req.on('error', function(e) {
          reply( { "text" : app.messages.message_failed } );
      });

      // post the data
      post_req.write(data_json);
      post_req.end();

  },
  config : {
      validate : {
          payload : {
              token: Joi.string().token().required(),
              team_id: Joi.string().token().required(),
              team_domain: Joi.string().required(),
              service_id: Joi.string().token().required(),
              channel_id: Joi.string().token().required(),
              channel_name: Joi.string().required(),
              timestamp: Joi.string().required(),
              user_id: Joi.string().required(),
              user_name: Joi.string().required(),
              text: Joi.string().required(),
              trigger_word: Joi.string().optional()
          }
      }
  }
};
