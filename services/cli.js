var Joi = require('joi');
module.exports = {
  method: 'POST',
  path: '/slack/cli/',
  handler: function (request, reply) {
      var app = request.server.settings.app;
      var command = request.payload.text.replace(request.payload.trigger_word, '').trim();

      /* First check the custom commands in the config. These are aliases to a command line script. */
      var custom_command;
      var custom_commands = app.cli.commands;
      for( var i = 0 ; i < custom_commands.length ; i++ )
      {
          if( custom_commands[i].key === command )
          {
              custom_command = custom_commands[i].value;
              command = custom_command;
              break;
          }
      }

      /* If it isn't a custom command, we check the blacklist */
      var blacklisted = false;
      if( !custom_command )
      {
          var blacklist = app.cli.filters.blacklist;
          for (var i = 0; i < blacklist.length; i++) {
              var item = blacklist[i];
              if( command.indexOf( item ) >= 0 )
              {
                  blacklisted = true;
                  break;
              }
          }
      }
      /* If not blacklisted and not a custom command, we check the whitelist */
      var whitelisted = false;
      if( !blacklisted && !custom_command )
      {
          var chunks = command.split(" ");
          whitelisted = (app.cli.filters.whitelist).indexOf( chunks[0] ) >= 0;
      }

      /* If it isn't blacklisted and is whitelisted or is a custom command, execute */
      if( (!blacklisted && whitelisted) || custom_command )
      {

        var exec = require('child_process').exec;
        var child;
        child = exec(command, function (error, stdout, stderr) {
          if (error !== null) {
              reply({ "text": error });
          }
          else
          {
            var text = stdout ? stdout : stderr;
            /* Now apply our filters */

            var filters = app.cli.filters.output;
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                text = text.replace( new RegExp(filter.regex, 'g') , filter.txt );
            }
            reply( { "text" : text } );
          }
        });
      }
      else
      {
        reply( { "text" : app.messages.access_denied } );
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
