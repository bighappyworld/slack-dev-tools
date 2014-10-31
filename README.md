Slack Command Line

This is a tool intended to be used with Slack as an Outgoing Web Hook. The idea is to give you access to some command line tools from the Slack chat room. Since command line tools are somewhat dangerous to expose, there are a number of restrictions in place.

You are also responsible for your own encryption.

This tool uses hapi.js as a simple REST API solution. There are a number of ways you can extend / use this app.

The first is by modifying the config.json file.

```
{
  "host" : "localhost",
  "port" : 5000,
  "app" : {
    "admin_ids" : [ "UXXXXXXXX", "UYYYYYYYY" ],
    "cli_token" : "ThisIsYourSlackChannelToken",
    "cli_file" : "./command-line.js",
    "cli_path" : "/slack/cli/",
    "access_denied" : "Invalid Request",
    "request_denied" : "Invalid Request",
    "illegal_command" : "Invalid Request",
    "cli_filters" : {
      "whitelist" : [ "pm2" ],
      "blacklist" : [ "sudo", "&&", ";", "|" ],
      "output_filters" : [
                            {
                              "regex" : "(\\[[0-9]*m)|(┌.*┐)|(├.*┤)|(└.*┘)",
                              "txt" : ""
                            }
                         ]
    },
    "cli_commands" : [
      { "slack_cmd" : "restart all", "cli_cmd" : "pm2 restart all" },
      { "slack_cmd" : "node processes", "cli_cmd" : "ps -aux | grep node" }
    ],
    "required_headers" : [
      { "key" : "user-agent",
        "value" : "Slackbot 1.0 (+https://api.slack.com/robots)" },
      { "key" : "host",
        "value" : "api.example.com" }
    ]
  }
}
```
The 'host' & 'port' are used to configure the hapi.js server. I run this beyind an nginx reverse proxy, so localhost is the right host.

The 'app' part of config is for application specific config.

'admin_ids' are the slack user ids of people you want to be able to use this. It rejects requests from any other user ids. If you leave it empty, it accepts requests from everyone.

'cli_token' is extremely important. This is the token given to you when you create a slack outgoing web hook.

'cli_path' is the http path you want to use. It will be the same path you configure in slack. So if you configure your outgoing web hook to send data to http://api.example.com/slack/cli/ then the 'cli_path' would be /slack/cli/

'access_denied', 'request_denied' and 'illegal_command' are the error messages. Change them if you want.

'cli_filters' are the first level of important stuff.

'whitelist' is an array of commands that let you go straight to the command line. I use pm2 as a process manager and so I add pm2 to the white list. Then I can use any pm2 commands, like pm2 list, pm2 restart all or anything from Slack.

'blacklist' is an array of commands that could possibly be dangerous and you want to block.

'output_filters' is an array of regular expressions and replacement text. the one as default filters out weird formatting and colors from the output before it replies to Slack.

'cli_commands' are effectively aliases. So if you need to do specific commands, such as multi step commands, you can implement them here.

'required_headers' are matched against the http request headers. Add any headers you need in there. If you add custom ones in your proxy, no problem, it will check for them.


If you want to use your own routes, create a folder called "routes" and add more routes to it. This is just adding to hapi.js routes and would let you add multiple slack outgoing webhooks to the server and not have to create a different web server. For each extra route, the slack validators are added using Joi.
