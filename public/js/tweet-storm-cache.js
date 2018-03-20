class Cache {
    constructor(postCapacity) {
        this.capacity = postCapacity;
        this.posts = [];
        this.newPosts = [];
        this.loading = true;
        this.loadTime = new Date();
        this.playedVideos = [];
    }

    get isFull() {
        return this.posts.length >= this.capacity;
    }

    get isLoading() {
        if (!this.loading) {
            return false;
        }
        if (this.isFull || (new Date()) - this.loadTime > 10000) {
            this.loading = false;
        }
        return this.loading;
    }

    get dequePost() {
        var oldPost = this.posts.shift();

        var videos = oldPost.find("video").toArray();
        for (var i = 0; i < videos.length; i++) {
            var index = this.playedVideos.indexOf(videos[i]);
            if (index > -1) {
                this.playedVideos.splice(index, 1)
            }
        }

        return oldPost;
    }

    get anyNewPosts() {
        return this.newPosts.length > 0;
    }

    get dequeNewPost() {
        return this.newPosts.shift();
    }

    get visibleVideos() {
        var visibleVideos = [];
        this.posts.forEach(function(x) {
            var videos = x.find("video");
            videos.each(function() {
                if (visible(this)) {
                    visibleVideos.push(this)
                } else {
                    this.pause();
                }
            });
        });
        return visibleVideos;
    }

    addPost(post, dequeCallback) {
        this.posts.push(post);
        if (this.posts.length > this.capacity)
        {
            var oldPost = cache.dequePost;
            dequeCallback(oldPost);
        }
    }

    addNewPost(newPost) {
        this.newPosts.push(newPost);
        if (this.newPosts.length > this.capacity) {
            this.newPosts.shift();
        }
    }

    clear() {
        this.posts = [];
        this.newPosts = [];
        this.playedVideos = []; 
    }
}