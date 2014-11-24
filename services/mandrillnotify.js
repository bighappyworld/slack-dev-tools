// https://hooks.slack.com/services/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

var Joi = require('joi');
var util = require('util');

module.exports = {
  method: 'POST',
  path: '/slack/mandrillnotify/',
  handler: function (request, reply) {

      var querystring = require('querystring');
      var https = require('https');
      var app = request.server.settings.app;

      /*
      { mandrill_events:
        [ { event: 'open',
            msg: {
                    "ts":1365109999,
                    "subject":"This an example webhook message",
                    "email":"example.webhook@mandrillapp.com",
                    "sender":"example.sender@mandrillapp.com",
                    "tags":["webhook-example"],
                    "opens":[{"ts":1365111111}],
                    "clicks":[{"ts":1365111111,"url":"http:\\/\\/mandrill.com"}],
                    "state":"sent",
                    "metadata":{"user_id":111},"_id":"exampleaaaaaaaaaaaaaaaaaaaaaaaaa",
                    "_version":"exampleaaaaaaaaaaaaaaa"
                  },
            _id: 'exampleaaaaaaaaaaaaaaaaaaaaaaaaa',
            ip: '127.0.0.1',
            location: {
                        "country_short":"US",
                        "country":"United States",
                        "region":"Oklahoma",
                        "city":"Oklahoma City",
                        "latitude":35.4675598145,
                        "longitude":-97.5164337158,
                        "postal_code":"73101",
                        "timezone":"-05:00"
                      },
            user_agent: 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.1.8) Gecko/20100317 Postbox/1.1.3',
            user_agent_parsed: {
                                  "type":"Email Client",
                                  "ua_family":"Postbox",
                                  "ua_name":"Postbox 1.1.3",
                                  "ua_version":"1.1.3",
                                  "ua_url":"http:\\/\\/www.postbox-inc.com\\/",
                                  "ua_company":"Postbox, Inc.",
                                  "ua_company_url":"http:\\/\\/www.postbox-inc.com\\/",
                                  "ua_icon":"http:\\/\\/cdn.mandrill.com\\/img\\/email-client-icons\\/postbox.png",
                                  "os_family":"OS X",
                                  "os_name":"OS X 10.6 Snow Leopard",
                                  "os_url":"http:\\/\\/www.apple.com\\/osx\\/",
                                  "os_company":"Apple Computer, Inc.",
                                  "os_company_url":"http:\\/\\/www.apple.com\\/",
                                  "os_icon":"http:\\/\\/cdn.mandrill.com\\/img\\/email-client-icons\\/macosx.png",
                                  "mobile":false},
                                  "ts":1415256670
                                },
            ts: 1415256670 }
          ]
      }
      */
      /*
        {
            "fallback": "Required text summary of the attachment that is shown by clients that understand attachments but choose not to show them.",

            "text": "Optional text that should appear within the attachment",
            "pretext": "Optional text that should appear above the formatted data",

            "color": "#36a64f", // Can either be one of 'good', 'warning', 'danger', or any hex color code

            // Fields are displayed in a table on the message
            "fields": [
                {
                    "title": "Required Field Title", // The title may not contain markup and will be escaped for you
                    "value": "Text value of the field. May contain standard message markup and must be escaped as normal.
                                May be multi-line.",
                    "short": false // Optional flag indicating whether the `value` is short enough to be displayed side-by-side
                                with other values
                }
            ]
        }

      */
      console.log( util.inspect(request.payload) );

      var replyText = "";
      var attachments = [];
      for( var i = 0 ; i < request.payload.mandrill_events.length; i++ ){
        attachments[i] = {};
        switch( request.payload.mandrill_events[i].event )
        {
            case 'send':
            {
                attachments[i]['fallback'] = "Mail Sent to " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Mail Sent';
                attachments[i]['color'] = 'good';
                break;
            }
            case 'deferral':
            {
                attachments[i]['fallback'] = "Mail delivery delayed to " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Mail Delayed';
                attachments[i]['color'] = 'warning';
                break;
            }
            case 'hard_bounce':
            {
                attachments[i]['fallback'] = "Mail hard bounced to " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Mail Hard Bounced';
                attachments[i]['color'] = 'warning';
                break;
            }
            case 'soft_bounce':
            {
                attachments[i]['fallback'] = "Mail soft bounced to " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Mail Soft Bounced';
                attachments[i]['color'] = 'warning';
                break;
            }
            case 'open':
            {
                attachments[i]['fallback'] = "Mail Opened by " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Mail Opened';
                attachments[i]['color'] = 'good';
                break;
            }
            case 'click':
            {
                attachments[i]['fallback'] = "Link Clicked in mail to " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Link Clicked';
                attachments[i]['color'] = 'good';
                break;
            }
            case 'spam':
            {
                attachments[i]['fallback'] = "Mail marked as spam to " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Mail Marked Spam';
                attachments[i]['color'] = 'warning';
                break;
            }
            case 'unsub':
            {
                attachments[i]['fallback'] = "Unsubscribed: " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Unsubscribed';
                attachments[i]['color'] = 'warning';
                break;
            }
            case 'reject':
            {
                attachments[i]['fallback'] = "Mail Rejected to " + request.payload.mandrill_events[i].msg.email;
                attachments[i]['text'] = 'Mail Rejected';
                attachments[i]['color'] = 'danger';
                break;
            }
        }
        // THIS ONLY WORKS WITH A COUPLE DIFFERENT TYPES, NOT ALL EVENTS HAVE LOCATIONS



        var recipient =request.payload.mandrill_events[i].msg && request.payload.mandrill_events[i].msg.email ? request.payload.mandrill_events[i].msg.email : null;

        var subject = request.payload.mandrill_events[i].msg && request.payload.mandrill_events[i].msg.subject ? request.payload.mandrill_events[i].msg.subject : null;

        var location = request.payload.mandrill_events[i].location && request.payload.mandrill_events[i].location.city && request.payload.mandrill_events[i].location.country ? request.payload.mandrill_events[i].location.city + ', ' + request.payload.mandrill_events[i].location.country : null;

        var client = request.payload.mandrill_events[i].user_agent_parsed && request.payload.mandrill_events[i].user_agent_parsed.ua_family && request.payload.mandrill_events[i].user_agent_parsed.os_family ? request.payload.mandrill_events[i].user_agent_parsed.ua_family + ' / ' + request.payload.mandrill_events[i].user_agent_parsed.os_family : null;

        var fields = [];
        if( recipient ) fields.push({
                                      "title" : "Recipient",
                                      "value" : recipient,
                                      "short" : true
                                    });
        if( subject ) fields.push({
                                      "title" : "Subject",
                                      "value" : subject,
                                      "short" : true
                                    });
        if( location ) fields.push({
                                      "title" : "Location",
                                      "value" : location,
                                      "short" : true
                                    });
        if( client ) fields.push({
                                      "title" : "Client",
                                      "value" : client,
                                      "short" : true
                                    });
        attachments[i]['fields'] = fields;
      }



      var data = {
          "text": "" + request.payload.mandrill_events.length + " Mandrill Event(s)",
          "attachments" : attachments
      };

      var https = require( '../lib/https.js' );

      https.postJSON( data,
                      app.mandrillnotify.host,
                      '443',
                      app.mandrillnotify.path,
                      function( err, res ){
                          if( err ) reply( { "text" : app.messages.message_failed,
                                             "success" : false } );
                          else{
                             reply( { "text" : "ok", "success" : res.response.length > 0 } );
                          }
                      });

  },
  config : {
      validate : {
          payload : {
              mandrill_events: Joi.array().required().min(1)
          }
      }
  }
};
