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


app.filter("headerChunk", function () {
    return function (orig, same, getChunkID) {
        if (!(orig instanceof Array)) return orig;
        if (orig.length == 0) return orig;

        var result = []

        var cur = []

        var i = 0
        for (i = 0; i < orig.length; i ++) {
            if (i == 0 || same(orig[i], orig[i-1])) {
                cur.push(orig[i])
            } else {
                result.push({
                    id: getChunkID(orig[i-1]),
                    items: cur
                })

                cur = [orig[i]]
            }
        }

        result.push({
            id: getChunkID(orig[orig.length - 1]),
            items: cur
        })

        for (i = 0; i < result.length; i ++) {
            result[i].$$hashKey = i
        }

        return result
    }
})

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

    $scope.filteredData = []
    

    $scope.doFiltering = function () {

        $scope.filteredData = $filter("filter")($scope.redditSearch.posts, $scope.postFilter)
        $scope.filteredData = $filter("limitTo")($scope.filteredData, 300)
        $scope.filteredData = $filter("orderBy")($scope.filteredData, function (p) {return p.date.unix()}, true)
        
        $scope.filteredData = $filter("headerChunk")(
            $scope.filteredData, 
            function (p1, p2) {
                return ((p1.date.month() == p2.date.month()) && (p1.date.year() == p2.date.year())) 
            },
            function (p) {
                return moment(p.date).startOf("month")
            }
        )

    }

    $scope.asdf = function () {
        for (var i = 0; i < $scope.filteredData.length; i ++) {
            console.log($scope.filteredData[i].date)
        }
    }

    $scope.getTotalFilteredPosts = function () {
        return $scope.filteredData.reduce(function (prev, cur) {
            return prev + cur.items.length
        }, 0)
    }


    $scope.commitAndBeginSearch = function () {
        
        $scope.filteredData.length = 0

        $scope.mainQueryData.commit()
        $scope.redditSearch.beginSearch()
    }


    // Watchers and broadcasts

    $scope.$on("redditSearch.updated", function (broadcast, newContentIndex) {
        $scope.doFiltering()
        $scope.$apply()
    })

    $scope.$on("redditSearch.timedOut", function (broadcast) {
        $scope.doFiltering()
        $scope.$apply()
    })

    $scope.$watch("postFilter", function () {
        $scope.doFiltering()
    }, true)

}])