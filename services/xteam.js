var Joi = require('joi');
module.exports = {
  method: 'POST',
  path: '/slack/xteam/{team}/{service}/{token}',
  handler: function (request, reply) {
      var app = request.server.settings.app;

      var text = request.payload.text;

      if( request.payload.trigger_word )
      {
          text = request.payload.text.replace(request.payload.trigger_word, '').trim();
      }

      var data = {
          "username": request.payload.user_name,
          "text": text
      };

      var https = require( '../lib/https.js' );
      try {
          https.postJSON( data,
                          app.xteam.host,
                          '443',
                          app.xteam.path + '/' + request.params.team + '/' + request.params.service + '/' + request.params.token,
                          function( err, res ){
                              if( err ) reply( { "text" : app.messages.message_failed,
                                                 "success" : false } );
                              else{
                                 reply( { "text" : "", "success" : res.response.length > 0 } );
                              }
                          });
      } catch( ex ) {
        console.debug( ex );
        reply( { "text" : ex, "success" : false } );
      }
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
