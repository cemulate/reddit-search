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

// This is an Angular wrapper around RedditSearch.js
// It simply converts RedditSearch's callbacks into Angular $broadcasts

app.factory("redditSearch", ["$rootScope", "mainQueryData", function ($rootScope, mainQueryData) {
    return new RedditSearch({
        queryData: mainQueryData.data,
        callbacks: {
            "updated": function (newContentIndex) {
                $rootScope.$broadcast("redditSearch.updated", newContentIndex)
            },
            "timedOut": function () {
                $rootScope.$broadcast("redditSearch.timedOut")
            }
        }
    })
}])


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

    $scope.monthSortedData = []

    /*
        redditSearch maintains a raw array of posts. For reasons of efficiency and display, the controller
        maintains its own store of individual arrays of posts, each belonging to a particular month.

        We build this modified data store from the posts of redditSearch each time it retrieves more
    */

    
    // Called on redditSearch.update broadcast

    $scope.buildMonthSortedData = function(startFrom) {

        var i = 0
        var j = 0

        for (i = startFrom; i < $scope.redditSearch.posts.length; i ++) {
            var p = $scope.redditSearch.posts[i]
            
            var found = false
            for (j = 0; j < $scope.monthSortedData.length; j ++) {
                var mg = $scope.monthSortedData[j]
                if (p.date.startOf("month").isSame(mg.month)) {
                    mg.posts.push(p)
                    found = true
                }
            }

            if (!found) {
                $scope.monthSortedData.push({
                    month: p.date.startOf("month"),
                    posts: [p]
                })
            }
        }
    }
    
    // Called on both redditSearch.update AND $watch for postFilter

    $scope.doFiltering = function () {

        angular.forEach($scope.monthSortedData, function (g) {
            g.filteredPosts = $filter('filter')(g.posts, $scope.postFilter)
        })
    }

    $scope.getTotalPosts = function () {
        return $scope.monthSortedData.reduce(function (prev, cur) {
            return prev + cur.posts.length
        }, 0)
    }

    $scope.getTotalFilteredPosts = function () {
        return $scope.monthSortedData.reduce(function (prev, cur) {
            return prev + cur.filteredPosts.length
        }, 0)
    }


    $scope.commitAndBeginSearch = function () {
        
        $scope.monthSortedData.length = 0

        $scope.mainQueryData.commit()
        $scope.redditSearch.beginSearch()
    }


    // Watchers and broadcasts

    $scope.$on("redditSearch.updated", function (broadcast, newContentIndex) {
        console.log("redditSearch.updated")
        $scope.buildMonthSortedData(newContentIndex)

        $scope.doFiltering()
        $scope.$apply()

    })

    $scope.$on("redditSearch.timedOut", function (broadcast) {
        $scope.$apply()
    })

    $scope.$watch("postFilter", function () {
        $scope.doFiltering()
    }, true)

}])