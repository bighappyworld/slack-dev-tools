module.exports = {
  method: 'POST',
  path: '/slack/cli/',
  handler: function (request, reply) {
      if( request.payload.token === request.server.settings.app.cli_token )
      {
          var command = request.payload.text.replace(request.payload.trigger_word, '').trim();

          /* First check the custom commands in the config. These are aliases to a command line script. */
          var custom_command;
          var custom_commands = request.server.settings.app.cli_commands;
          for( var i = 0 ; i < custom_commands.length ; i++ )
          {
              if( custom_commands[i].slack_cmd === command )
              {
                  custom_command = custom_commands[i].cli_cmd;
                  command = custom_command;
                  break;
              }
          }

          /* If it isn't a custom command, we check the blacklist */
          var blacklisted = false;
          if( !custom_command )
          {
              var blacklist = request.server.settings.app.cli_filters.blacklist;
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
              whitelisted = (request.server.settings.app.cli_filters.whitelist).indexOf( chunks[0] ) >= 0;
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

                var filters = request.server.settings.app.cli_filters.output_filters;
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
            reply( { "text" : request.server.settings.app.access_denied } );
          }



      }
      else
      {
          reply( { "text" : request.server.settings.app.access_denied } );
      }
  }
};
