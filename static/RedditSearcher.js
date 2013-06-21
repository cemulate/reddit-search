function SimplePost(origPost) {
    this.title = origPost.data.title
    this.date = moment.unix(origPost.data.created)
    this.rawTime = origPost.data.created
    this.comments = "http://www.reddit.com" + origPost.data.permalink
    this.link = origPost.data.url
    this.thumbnail = origPost.data.thumbnail
    this.subreddit = origPost.data.subreddit
    this.op = origPost.data.author

    this.domain = this.extractDomain(this.link)
    this.extension = this.extractExtension(this.link)
    if (this.extension == "") {
        this.extension == "No extension"
    }


    this.isKeyDate = false
}

SimplePost.prototype.extractDomain = function (url) {
    var tmp = document.createElement('a')
    tmp.href = this.link
    return tmp.hostname
}

SimplePost.prototype.extractExtension = function (url) {
    var end = url.substr(url.lastIndexOf("/"))
    return end.substr((Math.max(0, end.lastIndexOf(".")) || Infinity) + 1)
}


function RedditSearcher($rootScope, mainQueryData) {
    this.$rootScope = $rootScope
    this.mainQueryData = mainQueryData

    this.monthGroups = []

    this.searchState = {}

    this.mode = "userpage"

    this.reset()
}

RedditSearcher.prototype.reset = function () {
    this.monthGroups.length = 0

    this.searchState.pagesSearched = 0
    this.searchState.postsSearched = 0
    this.searchState.reachedRedditLimit = false
    
    this.searchState.totalPostsSearched = 0

    this.searchState._latestChildName = null

    this.searchState.error = null
}

RedditSearcher.prototype.isBusy = function () {
    return ((this._retrieveTimeout != null) && !this.searchState.reachedRedditLimit)
}

RedditSearcher.prototype.retrievePosts = function () {

    var url = ""

    // Url is constructed from data differently depending on mode:

    if (this.mode == "userpage") {
        
        url = "http://www.reddit.com/user/" + this.mainQueryData.data.username + "/" + this.mainQueryData.data.userpage + ".json?jsonp=?&limit=100&sort=new"
    
    } else if (this.mode == "subreddit") {
        
        url = "http://www.reddit.com/r/" + this.mainQueryData.data.subreddit + "/" + this.mainQueryData.data.subreddit_feed + ".json?jsonp=?&limit=100"
    
    }

    if (this.searchState._latestChildName) {
        url += "&after=" + this.searchState._latestChildName
    }




    // Closure for this in async callbacks
    var self = this

    this._ajaxRequest = $.getJSON(url, function (ret) {

        self.$rootScope.$apply(function () {

            if (self._errorTimeout) {
                clearTimeout(self._errorTimeout)
                self._errorTimeout = null
            }

            if (self._ajaxRequest) {
                self._ajaxRequest = null
            }


            var i = 0
            for (i = 0; i < ret.data.children.length; i ++) {

                var orig = ret.data.children[i]
                
                var sp = new SimplePost(orig)
                // self.posts.push(sp)

                var postMonth = sp.date.startOf('month')

                var j = 0
                var found = false
                for (j = 0; j < self.monthGroups.length; j ++) {
                    var cg = self.monthGroups[j]
                    if (cg.month.isSame(postMonth)) {
                        cg.posts.push(sp)
                        found = true
                    }
                }

                if (found == false) {
                    self.monthGroups.push({
                        month: postMonth,
                        posts: [sp]
                    })
                }
            }

            self.searchState.pagesSearched += 1
            self.searchState.totalPostsSearched += ret.data.children.length
            
            // If it returned less than 100 items, that's the end of the road
            var lastindex = ret.data.children.length - 1
            if (lastindex < 99) {
                self.searchState.reachedRedditLimit = true
            }

            // It might have some stuf in in though. If not, just return
            if (lastindex < 0) {
                return
            }

            self.searchState._latestChildName = ret.data.children[lastindex].data.name

            if (!self.searchState.reachedRedditLimit) {
                self._retrieveTimeout = setTimeout(function () {
                    self.retrievePosts()  
                }, 3000)
            }
        })
    
    })

    this._errorTimeout = setTimeout(function () {
        self.$rootScope.$apply(function () {
            this.error = "no_page"
            if (this._ajaxRequest) {
                this._ajaxRequest.abort()
                this._ajaxRequest = null
                this.searchState.reachedRedditLimit = true
            }
        })
    }, 6000)

}

RedditSearcher.prototype.stopSearch = function () {

    // End any async items. Any one of these could be active depending on where the previous
    // search was in its progress. 

    if (this._errorTimeout) {
        clearTimeout(this._errorTimeout)
        this._errorTimeout = null
    }

    if (this._retrieveTimeout) {
        clearTimeout(this._retrieveTimeout)
        this._retrieveTimeout = null
    }

    if (this._ajaxRequest) {
        this._ajaxRequest.abort()
        this._ajaxRequest = null
    }
}

RedditSearcher.prototype.beginSearch = function () {
    
    // In case one's currently running
    this.stopSearch()

    // Reset all the intermediate variables
    this.reset()

    this.mainQueryData.commit()

    // If the timer is not currently repeatedly calling retrieve, start it up. 
    // It will keep itself going after the first call
    var self = this
    if (!this._retrieveTimeout) {
        this._retrieveTimeout = setTimeout(function () {
            self.retrievePosts()  
        }, 100)
    }
}