var config = require('./config.json');
var express = require('express');
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var tweetToHTML = require('tweet-to-html');
var moment = require('moment');

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(config.webserver.port);

var Twit = require('twit')

var T = new Twit(config.twitter)

var tweetCache = [];

T.get('search/tweets', { q: config.hashtag, count: config.tweet_cache_size, result_type: "recent" }, function(err, data, response) {
    var tweets = data.statuses.sort(function(a, b) { return moment(a.created_at, "dd MMM DD HH:mm:ss ZZ YYYY", "en").unix() - moment(b.created_at, "dd MMM DD HH:mm:ss ZZ YYYY", "en").unix(); } );
    tweetCache = tweetToHTML.parse(data.statuses);
});

io.on('connection', function(client) {  
    console.log('Client connected...');
    tweetCache.forEach(function(tweet) {
        client.emit('tweet', tweet);
    });
});

var stream = T.stream('statuses/filter', { track: config.hashtag, language: 'en' })

stream.on('tweet', function (tweet) {
    var htmlTweet = tweetToHTML.parse(tweet);
    tweetCache.push(htmlTweet);
    io.emit('tweet', htmlTweet);

    if (tweetCache.length > config.tweet_cache_size)
    {
        tweetCache.shift();
    }
});