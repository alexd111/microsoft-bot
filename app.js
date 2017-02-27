var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector, [
    function (session) {
        builder.Prompts.text(session, "Hello... Which city are you looking in?");
    },
    function (session, results) {
        session.privateConversationData.city = results.response;
        builder.Prompts.number(session, "Ok, you are looking in " + results.response + ", How many bedrooms are you looking for?");
    },
    function (session, results) {
        session.privateConversationData.bedrooms = results.response;
        builder.Prompts.number(session, "You are looking for " + results.response + " bedrooms, what is the max price per month you want to pay?");
    },
    function (session, results) {
        session.privateConversationData.ppm = results.response;
        builder.Prompts.text(session, "Your max rent is " + results.response + " per month, woulld you like a furnished place?");
    },
    function (session, results) {
        if (results.response == "yes") {
          session.privateConversationData.isFurnished = 1;
        }
        else {
          session.privateConversationData.isFurnished = 0;
        }
        session.send("You are looking in " + session.privateConversationData.city +
                     "Your number of bedrooms is " + session.privateConversationData.bedrooms +
                     "Your price per month is " + session.privateConversationData.ppm +
                     "Your furnishings is " + session.privateConversationData.isFurnished);
        var url = "http://localhost:5000/accommodation/bristol/5/400/1";

        request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);

          }
        });
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
            ]);
            session.send(msg);
    }
]);

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
