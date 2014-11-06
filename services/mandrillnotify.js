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
            msg: {"ts":1365109999,"subject":"This an example webhook message","email":"example.webhook@mandrillapp.com","sender":"example.sender@mandrillapp.com","tags":["webhook-example"],"opens":[{"ts":1365111111}],"clicks":[{"ts":1365111111,"url":"http:\\/\\/mandrill.com"}],"state":"sent","metadata":{"user_id":111},"_id":"exampleaaaaaaaaaaaaaaaaaaaaaaaaa","_version":"exampleaaaaaaaaaaaaaaa"},
            _id: 'exampleaaaaaaaaaaaaaaaaaaaaaaaaa',
            ip: '127.0.0.1',
            location: {"country_short":"US","country":"United States","region":"Oklahoma","city":"Oklahoma City","latitude":35.4675598145,"longitude":-97.5164337158,"postal_code":"73101","timezone":"-05:00"},
            user_agent: 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.1.8) Gecko/20100317 Postbox/1.1.3',
            user_agent_parsed: {"type":"Email Client","ua_family":"Postbox","ua_name":"Postbox 1.1.3","ua_version":"1.1.3","ua_url":"http:\\/\\/www.postbox-inc.com\\/","ua_company":"Postbox, Inc.","ua_company_url":"http:\\/\\/www.postbox-inc.com\\/","ua_icon":"http:\\/\\/cdn.mandrill.com\\/img\\/email-client-icons\\/postbox.png","os_family":"OS X","os_name":"OS X 10.6 Snow Leopard","os_url":"http:\\/\\/www.apple.com\\/osx\\/","os_company":"Apple Computer, Inc.","os_company_url":"http:\\/\\/www.apple.com\\/","os_icon":"http:\\/\\/cdn.mandrill.com\\/img\\/email-client-icons\\/macosx.png","mobile":false},"ts":1415256670},
            ts: 1415256670 },
          { event: 'open',
            msg: [Object],
            _id: 'exampleaaaaaaaaaaaaaaaaaaaaaaaaa1',
            ip: '127.0.0.1',
            location: [Object],
            user_agent: 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.1.8) Gecko/20100317 Postbox/1.1.3',
            user_agent_parsed: [Object],
            ts: 1415256670 }
          ]
      }
      */
      /*
        {
    "fallback": "Required text summary of the attachment that is shown by clients that understand attachments
                    but choose not to show them.",

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

      var replyText = "";
      var attachments = [];
      for( var i = 0 ; i < request.payload.mandrill_events.length; i++ ){
        attachments[i] = {};
        attachments[i]['fallback'] = "A mandrill event occured";
        attachments[i]['pretext'] = request.payload.mandrill_events[i].msg.event;
        attachments[i]['color'] = 'good';
        attachments[i]['fields'] = [
          {
            "title" : "Recipient",
            "value" : request.payload.mandrill_events[i].msg.email,
            "short" : true
          },
          {
            "title" : "Subject",
            "value" : request.payload.mandrill_events[i].msg.subject,
            "short" : true
          },
          {
            "title" : "Country",
            "value" : request.payload.mandrill_events[i].location.country_short,
            "short" : true
          },
          {
            "title" : "Mobile",
            "value" : (request.payload.mandrill_events[i].user_agent_parsed.mobile ? "true" : "false"),
            "short" : true
          }

        ];
      }

      console.log( util.inspect(attachments) );



      var data = {
          "text": "Mandrill Event Occured",
          "attachments" : attachments
      };


      var data_json = JSON.stringify(data);

      // An object of options to indicate where to post to
      var post_options = {
          host: app.mandrillnotify.host,
          port: '443',
          path: app.mandrillnotify.path,
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': data_json.length
          }
      };

      // Set up the request
      var post_req = https.request(post_options, function(res) {
          res.setEncoding('utf8');
          var success = false;
          res.on('data', function (chunk) {
              success = true;
          });
          res.on('end', function() {
              console.log( "pushed notification" );
              reply( { "text" : "ok", "success" : success } );
          });
      });
      post_req.on('error', function(e) {
          console.log( "pushed failed : " + e );
          reply( { "text" : "failed", "success" : false } );
      });

      // post the data
      post_req.write(data_json);
      post_req.end();




  },
  config : {
      validate : {
          payload : {
              mandrill_events: Joi.array().required().min(1)
          }
      }
  }
};