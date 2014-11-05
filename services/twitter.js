

var Joi = require('joi');
var util = require('util');
module.exports = {
  method: 'POST',
  path: '/slack/twitter/',
  handler: function (request, reply) {

      var app = request.server.settings.app;
      var text = request.payload.text;
      if( request.payload.trigger_word )
      {
          text = request.payload.text.replace(request.payload.trigger_word, '').trim();
      }

      // grab any URLs

      var matches = text.match( new RegExp('(http|ftp|https)://[a-z0-9\-_]+(\.[a-z0-9\-_]+)+([a-z0-9\-\.,@\?^=%&;:/~\+#]*[a-z0-9\-@\?^=%&;/~\+#])?', 'g') );

      var Twit = require('twit')

      var tweeter = function( tweet ){
          tweet = tweet.replace( '<', '' );
          tweet = tweet.replace( '>', '' );

          var twit = new Twit({
              consumer_key: app.twitter.twitter_consumer_key,
              consumer_secret: app.twitter.twitter_consumer_secret,
              access_token: app.twitter.twitter_access_token,
              access_token_secret: app.twitter.twitter_access_token_secret
          });
          if( tweet.length <= 140 ) {

            twit.post('statuses/update', { status: tweet }, function(err, data, response) {
              if( err ) reply( { "text" : err } );
              else reply( { "text" : "You Tweeted: \"" + tweet + "\" And Twitter posted: \"" + data.text + "\"" } );
            });
          }
          else {
             reply( { "text" : "Too Long: " + tweet.length + " characters" } );
          }

      };

      if( matches && matches.length > 1 )
      {
          reply( { "text" : "Only use one URL in your tweet" } );
      }
      else if( !matches || matches.length === 0 )
      {
          tweeter(text);
      }
      else
      {
          var Bitly = require('bitly');
          var bitly = new Bitly(app.twitter.bitly_user, app.twitter.bitly_token);
          bitly.shorten( matches[0], function(err, response) {
              if (err) reply( { "text" : app.messages.message_failed } );
              else tweeter(text.replace( matches[0], response.data.url ));

          });
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
