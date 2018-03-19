var config = require('./config.json');
var express = require('express');
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var tweetToHTML = require('tweet-to-html');
var moment = require('moment');
var Twit = require('twit')

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {  
    res.sendFile(__dirname + '/index.html');
});

server.listen(config.webserver.port);

var twit = new Twit(config.twitter)

var tweetCache = [];

var hashtags = config.hashtags.replace(/#/g, "").split(/[\s,]+/).filter(function(x) { return x !== "" && x !== null; });
var hashtagString = "#" + hashtags.join(", #");

twit.get('search/tweets', { q: hashtagString, count: config.tweet_cache_size, result_type: "recent", language: config.language }, function(err, data, response) {
    var tweets = data.statuses.sort(function(a, b) { return moment(a.created_at, "dd MMM DD HH:mm:ss ZZ YYYY", "en").unix() - moment(b.created_at, "dd MMM DD HH:mm:ss ZZ YYYY", "en").unix(); } );
    tweetCache = tweetToHTML.parse(data.statuses);
});

io.on('connection', function(client) {  
    console.log('Client connected...');
    client.emit('config', { "title": config.title, "hashtags": hashtags, "tweet_cache_size": config.tweet_cache_size, "scrollable": config.scrollable });
    tweetCache.forEach(function(tweet) {
        client.emit('tweet', tweet);
    });
});

var stream = twit.stream('statuses/filter', { track: hashtagString, language: config.language })

stream.on('tweet', function (tweet) {
    var htmlTweet = tweetToHTML.parse(tweet);
    tweetCache.push(htmlTweet);
    io.emit('tweet', htmlTweet);

    if (tweetCache.length > config.tweet_cache_size)
    {
        tweetCache.shift();
    }
});