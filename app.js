var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector, [
    function(session) {
        builder.Prompts.text(session, "Hello... Which city are you looking in?");
    },
    function(session, results) {
        session.privateConversationData.city = results.response;
        builder.Prompts.number(session, "Ok, you are looking in " + results.response + ", How many bedrooms are you looking for?");
    },
    function(session, results) {
        session.privateConversationData.bedrooms = results.response;
        builder.Prompts.number(session, "You are looking for " + results.response + " bedrooms, what is the max price per month you want to pay?");
    },
    function(session, results) {
        session.privateConversationData.ppm = results.response;
        builder.Prompts.text(session, "Your max rent is " + results.response + " per month, woulld you like bills included?");
    },
    function(session, results) {
        if (results.response == "yes") {
            session.privateConversationData.bills = 1;
        } else {
            session.privateConversationData.bills = 0;
        }
        session.send("You are looking in " + session.privateConversationData.city +
            "Your number of bedrooms is " + session.privateConversationData.bedrooms +
            "Your price per month is " + session.privateConversationData.ppm +
            "Your furnishings is " + session.privateConversationData.bills);
        var url = "http://localhost:5000/accommodation/" + session.privateConversationData.city + "/" + session.privateConversationData.bedrooms.toString() +
            "/" + session.privateConversationData.ppm.toString() + "/1/" + session.privateConversationData.bills.toString();

        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);

                var cards = makeCards(session, data);
                var reply = new builder.Message(session)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(cards);
                session.send(reply);
            }
        });

    }
]);

function makeCards(session, data) {
    var cards = [];
    for (var i = 0; i < data.length; i++) {
        cards.push(new builder.HeroCard(session)
            .title(data[i].bedrooms + " bedroom house in " + data[i].address)
            .subtitle("£" + data[i].ppm + " per month")
            .text("Tap or click to open the house listing for more info.")
            .tap(builder.CardAction.openUrl(session, data[i].url)));
    }
    return cards;
}

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
