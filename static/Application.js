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

    // $scope.handleFiltering = function () {
    //     var ret = []

    //     var total = 0
    //     var i = 0
        
    //     for (i = 0; i < redditSearcher.monthGroups.length; i ++) {
    //         var mg = redditSearcher.monthGroups[i]
    //         var pf = $filter('filter')(mg.posts, $scope.postFilter)
    //         ret.push({
    //             month: mg.month,
    //             posts: pf
    //         })

    //         total += pf.length
    //         if (total > 300) {
    //             break
    //         }
    //     }

    //     return ret
    // }

}])