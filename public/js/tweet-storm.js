//Variables
var cache, refreshTimer, videoTimer;

//Setup full-screen mode
if (screenfull.enabled) {
    screenfull.on('change', () => {
        if (screenfull.isFullscreen) {
            $(".fullscreen").hide();
        } else {
            $(".fullscreen").show();
        }
    });

    $(".fullscreen").click(function() {
        screenfull.request();
    });
}

//Setup post layout system
var grid = $("#future").masonry({
    itemSelector: ".post-container",
    columnWidth: ".grid-sizer",
    transitionDuration: 800,
    stagger: 30
});

//Connect sockets
var socket = io.connect("http://localhost:4200");
socket.on("connect", function(data) {
   console.log("TweetStorm connected to server")
});

//Load config from socket
socket.on("config", function(config) {
    console.log("TweetStorm config received")

    //Set title
    var hashtagString = ":";
    config.hashtags.forEach(x => {
        hashtagString += " <a href='http://twitter.com/hashtag/" + x + "' target='_blank'>#" + x + "</a>"
    });
    $(".title").html(config.title + hashtagString);

    //Create cache
    cache = new Cache(config.post_cache_size);

    //Set scrollability
    if (config.scrollable) {
        $("body").css("overflow-y", "scroll");
    } else {
        $("body").css("overflow-y", "hidden");            
    }

    //Set timers
    clearTimeout(refreshTimer);
    clearTimeout(videoTimer);
    refreshTimer = setInterval(update, config.client_refresh_rate);
    videoTimer = setInterval(updateVideo, 1000);
});

//New post received
socket.on('post', function(post) {
    cache.addNewPost(post);
    if (cache.isLoading) {
        $(".loader-wrapper").hide();
        update();
    }
});

//Update UI with new posts
var update = function() {
    while (cache.anyNewPosts) {
        var post = cache.dequeNewPost;

        //Pick a ramdom width for the post, media posts are bigger
        var randomWidth = Math.floor(Math.random() * 11) + 10;
        if (post.hasOwnProperty("entities") && post.entities.hasOwnProperty("media") && post.entities.media.length >= 1) {
            randomWidth += 5;
        }

        //Create and store post html
        var htmlPost = $("<div class='post-container' style='max-width: " + randomWidth + "%;'><div class='post'>" + post.html + "</div></div>");

        //Setup videos
        var videos = htmlPost.find("video");
        videos.each(function() {
            this.controls = false;
            this.muted = true;
            this.onended = function() {
                this.currentTime = 0;
            };
        });

        //Store post
        cache.addPost(htmlPost, removePost);

        //Refresh layout once images have loaded
        htmlPost.imagesLoaded().progress(function() {
            grid.masonry();
        })

        //Add post to layout
        grid.prepend(htmlPost).masonry('prepended', htmlPost );
    }
};

var removePost = function(post) {
    grid.masonry('remove', post);
}

var updateVideo = function() {
    var visibleVideos = cache.visibleVideos;
    for (var i = 0; i < visibleVideos.length; i++) {
        if (playing(visibleVideos[i])) {
            return;
        }
    }

    var unplayedVideos = visibleVideos.filter(x => cache.playedVideos.indexOf(x) === -1);

    if (unplayedVideos.length > 0) {
        var index = Math.floor(Math.random() * unplayedVideos.length)
        playVideo(unplayedVideos[index]);
        cache.playedVideos.push(unplayedVideos[index]);
    } else {
        cache.playedVideos = [];
    }
};

var playVideo = function(video) {
    var playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {})
        .catch(error => {});
    }
}