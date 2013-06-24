app = angular.module("RedditSearchApplication", [])

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
app.service("redditSearch", ["$rootScope", "mainQueryData", RedditSearch])


app.controller("MainController", ["$scope", "redditSearch", "mainQueryData", "$filter", function ($scope, redditSearch, mainQueryData, $filter) {
    $scope.redditSearch = redditSearch
    $scope.mainQueryData = mainQueryData


    // The controller handles details about -displaying- the data that redditSearch shouldn't be responsible for

    $scope.postFilter = {
        subreddit: "",
        title: "",
        domain: "",
        op: "",
        extension: ""
    }

    // redditSearch doesn't $apply during it's async update, instead it uses
    // a broadcast based approach. 

    $scope.$on("redditSearch.updated", function () {

        $scope.doFiltering()
        $scope.$apply()

    })


    // The controller handles the filtering independently. This way is optimized for 
    // The two-dimensional data structure we have

    $scope.$watch("postFilter", function () {
        $scope.doFiltering()
    }, true)

    $scope.doFiltering = function () {

        // Month group by month group, filter group.posts into group.filteredPosts

        angular.forEach($scope.redditSearch.monthGroups, function (g) {
            g.filteredPosts = $filter('filter')(g.posts, $scope.postFilter)
        })
    }

    $scope.getTotalPosts = function () {
        return $scope.redditSearch.monthGroups.reduce(function (prev, cur) {
            return prev + cur.posts.length
        }, 0)
    }

    $scope.getTotalFilteredPosts = function () {
        return $scope.redditSearch.monthGroups.reduce(function (prev, cur) {
            return prev + cur.filteredPosts.length
        }, 0)
    }

}])