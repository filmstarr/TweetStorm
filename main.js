//Gather dependencies
var config = require('./config.json');
var express = require('express');
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var tweetToHTML = require('tweet-to-html');
var moment = require('moment');
var Twit = require('twit')
var twit = new Twit(config.twit_config)

//Setup webserver
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {  
    res.sendFile(__dirname + '/public/index.html');
});
server.listen(config.webserver.port);

//Variables
var postCache = [];
var hashtags = config.hashtags.replace(/#/g, "").split(/[\s,]+/).filter(function(x) { return x !== "" && x !== null; });
var hashtagString = "#" + hashtags.join(", #");

//Load recent posts
twit.get('search/tweets', { q: hashtagString, count: config.tweet_cache_size, result_type: "recent", language: config.language }, function(err, data, response) {
    var tweets = data.statuses.sort(function(a, b) { return moment(a.created_at, "dd MMM DD HH:mm:ss ZZ YYYY", "en").unix() - moment(b.created_at, "dd MMM DD HH:mm:ss ZZ YYYY", "en").unix(); } );
    postCache = tweetToHTML.parse(data.statuses);
});

//Subscribe to new posts
var stream = twit.stream('statuses/filter', { track: hashtagString, language: config.language })
stream.on('tweet', function (tweet) {
    var htmlTweet = tweetToHTML.parse(tweet);
    postCache.push(htmlTweet);
    io.emit('post', { html: htmlTweet.html, attributes: htmlTweet.attributes } );

    //Tidy up cache
    if (postCache.length > config.tweet_cache_size)
    {
        postCache.shift();
    }
});

//Client connected, send config and recent posts
io.on('connection', function(client) {  
    console.log('TweetStorm client connected');
    client.emit('config', {
        "title": config.title,
        "hashtags": hashtags,
        "post_cache_size": config.post_cache_size,
        "scrollable": config.scrollable,
        "client_refresh_rate": config.client_refresh_rate
    });
    postCache.forEach(function(tweet) {
        client.emit('post', tweet);
    });
});