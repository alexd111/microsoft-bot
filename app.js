var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
  botId: 'housy',
    appId: '516b7dfa-fba0-4356-bb83-ccdd6c0c5866',
    appPassword: 'XEXnpZdTN5XhwMpRiBgwfS5'
});

// Begin bot waterfall conversation
var bot = new builder.UniversalBot(connector, [
    function(session) {
        builder.Prompts.text(session, "Hi, I will help you find a place to live. What is your name?");
    },
    function(session, results) {
      session.privateConversationData.userName = results.response;
        builder.Prompts.text(session, "Hello " + results.response + ". Which city are you looking in?");
    },
    function(session, results, args) {
        session.privateConversationData.city = results.response;
        builder.Prompts.number(session, "Ok, you are looking in " + results.response + ", How many bedrooms are you looking for?");
    },
    function(session, results) {
        session.privateConversationData.bedrooms = results.response;
        builder.Prompts.number(session, "You are looking for " + results.response + " bedrooms, what is the max price per month you want to pay?");
    },
    function(session, results) {
        session.privateConversationData.ppm = results.response;
        builder.Prompts.confirm(session, "Your max rent is " + results.response + " per month, woulld you like bills included?");
    },
    function(session, results) {
        if (results.response == true) {
            session.privateConversationData.bills = 1;
        } else {
            session.privateConversationData.bills = 0;
        }

        builder.Prompts.choice(session, "How about furnishings?", ["Furnished", "Unfurnished"]);
    },
    function(session, results) {
        console.log(results.response.entity);
        if (results.response.entity == "Furnished") {
            session.privateConversationData.furnished = 1;
        } else {
            session.privateConversationData.furnished = 0;
        }
        var url = "http://localhost:5000/accommodation/" + session.privateConversationData.city + "/" + session.privateConversationData.bedrooms.toString() +
            "/" + session.privateConversationData.ppm.toString() + "/" + session.privateConversationData.furnished.toString() + "/" + session.privateConversationData.bills.toString();
             session.sendTyping();

        // Send request to the accommodation API
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                session.send("Ok " + session.privateConversationData.userName + ", I have found " + data.length + " houses for you:");
                var cards = makeCards(session, data);
                var reply = new builder.Message(session)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(cards);
                session.send(reply);
            }
        });
    }
]);

// Create cards for prcoessing by the chatbot
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
