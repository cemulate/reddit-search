app = angular.module("RedditSearchApplication", [])

app.config(['$compileProvider', function($compileProvider) {   
    $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|blob):/);
}])

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

    $scope.settings = {
        maxDisplayed: 300,
        collapsedMonths: []
    }

    $scope.JSONExportData = {
        blob: null,
        link: ""
    }

    $scope.filteredData = []
    

    $scope.doFiltering = function (orderBefore) {

        $scope.filteredData = $filter("filter")($scope.redditSearch.posts, $scope.postFilter)
        $scope.filteredData = $filter("limitTo")($scope.filteredData, $scope.settings.maxDisplayed)
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

    // Convenience functions for UI bindings

    $scope.getTotalFilteredPosts = function () {
        return $scope.filteredData.reduce(function (prev, cur) {
            return prev + cur.items.length
        }, 0)
    }

    $scope.getDisplayTextForExtension = function (post) {
        if (!post.extension || post.extension.length == 0) {
            return ""
        } else {
            return "(" + post.extension + ")"
        }
    }

    $scope.isMonthGroupCollapsed = function (mg) {
        var r = util.softIndexOf(mg.id, $scope.settings.collapsedMonths, function (a, b) { return a.isSame(b) })
        return (r > -1)
    }

    $scope.isAnyMonthGroupCollapsed = function () {
        return ($scope.settings.collapsedMonths.length > 0)
    }

    $scope.toggleMonthGroupCollapsed = function (mg) {
        var ind = util.softIndexOf(mg.id, $scope.settings.collapsedMonths, function (a, b) { return a.isSame(b) })
        if (ind > -1) {
            $scope.settings.collapsedMonths.splice(ind, 1)
        } else {
            $scope.settings.collapsedMonths.push(mg.id)
        }
    }

    $scope.expandAll = function () {
        $scope.settings.collapsedMonths.length = 0
    }

    

    // Actions

    $scope.toggleSearch = function () {
        if ($scope.redditSearch.isBusy()) {
            $scope.redditSearch.stopSearch()
        } else {
            $scope.commitAndBeginSearch()
        }
    }

    $scope.commitAndBeginSearch = function () {
        
        $scope.filteredData.length = 0

        $scope.mainQueryData.commit()
        $scope.redditSearch.beginSearch()
    }

    $scope.exportJSON = function () {
        var s = JSON.stringify($scope.redditSearch.posts)
        $scope.JSONExportData.blob = new Blob([s])
        $scope.JSONExportData.link = window.URL.createObjectURL($scope.JSONExportData.blob)
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

    $scope.$watch("settings", function () {
        $scope.doFiltering()
    }, true)

}])