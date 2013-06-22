app = angular.module("RedditSearch", [])

app.service("mainQueryData", function () {
    this.pending_data = {
        username: "",
        userpage: "",
        subreddit: "",
        subreddit_feed: ""
    }
    this.data = {}
    this.commit = function () {
        angular.copy(this.pending_data, this.data)
    }
})

// Main application logic - defined in RedditSearcher.js
app.service("redditSearcher", ["$rootScope", "mainQueryData", RedditSearcher])


app.controller("MainController", ["$scope", "redditSearcher", "mainQueryData", "$filter", function ($scope, redditSearcher, mainQueryData, $filter) {
    $scope.redditSearcher = redditSearcher
    $scope.mainQueryData = mainQueryData


    // The controller handles details about -displaying- the data that redditSearcher shouldn't be responsible for

    $scope.postFilter = {
        subreddit: "",
        title: "",
        domain: "",
        op: "",
        extension: ""
    }



    $scope.getTotalPosts = function () {
        return $scope.redditSearcher.monthGroups.reduce(function (prev, cur) {
            return prev + cur.posts.length
        }, 0)
    }

    $scope.getTotalFilteredPosts = function () {
        return $scope.redditSearcher.monthGroups.reduce(function (prev, cur) {
            return prev + cur.filteredPostLength
        }, 0)
    }

    // Instead of filtering in the html, we perform the filter here in hte controller
    // This gives us a chance to "sneak in" the 'filteredPostLength' variable and 
    // piggyback it onto the monthGroup object. 

    // This way, every monthGroup object will have this additional filteredPostLength property,
    // which 'getTotalFilteredPosts' can sum up to find the total number of results

    $scope.filterPosts = function (monthGroup) {

        var ret = $filter('filter')(monthGroup.posts, $scope.postFilter)
        monthGroup.filteredPostLength = ret.length

        return ret
    }

}])