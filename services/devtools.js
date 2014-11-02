var Joi = require('joi');
module.exports = {
  method: 'POST',
  path: '/slack/devtools/',
  handler: function (request, reply) {
      var app = request.server.settings.app;
      var command = request.payload.text.replace(request.payload.trigger_word, '').trim();

      switch( command )
      {
          case "userid" : reply( { "text" : request.payload.user_id } ); break;
          case "teamid" : reply( { "text" : request.payload.team_id } ); break;
          case "channelid" : reply( { "text" : request.payload.channel_id } ); break;
          case "serviceid" : reply( { "text" : request.payload.service_id } ); break;
          default : reply( { "text" : "Valid commands are: userid, teamid, channelid, serviceid" } ); break;
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
              trigger_word: Joi.string().required()
          }
      }
  }
};
