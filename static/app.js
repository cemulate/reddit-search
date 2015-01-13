$.ajax("static/appTemplate.html").then(function(appTemplate) {

	ractive = new Ractive({
		el: 'appContainer',
		template: appTemplate,
		data: {
			mainQueryData: {
				username: '',
				userpage: 'liked'
			},
			rawFilterData: {
				subreddit: '',
				title: '',
				domain: '',
				op: '',
				extension: ''
			},
			filterData: {
				subreddit: '',
				title: '',
				domain: '',
				op: '',
				extension: ''
			},
			filterUpdateNeeded: false,
			searchInProgress: false,
			redditSearch: new RedditSearch(),
			filteredPosts: [],
			displaySettings: {
				maxDisplayed: 50
			}
		},
		magic: true
	});

	// The callback function to filter the the raw redditSeach.posts
	ractive.data.postFilter = function (x) {
		return (x.subreddit.indexOf(ractive.data.filterData.subreddit) > -1) &&
			   (x.title.indexOf(ractive.data.filterData.title) > -1) &&
			   (x.domain.indexOf(ractive.data.filterData.domain) > -1) &&
			   (x.op.indexOf(ractive.data.filterData.op) > -1) &&
			   (x.extension.indexOf(ractive.data.filterData.extension) > -1);
	};

	// Function to filter by filterData and cut to maxDisplayed length
	ractive.data.doFiltering = function() {
		var temp = ractive.data.redditSearch.posts.filter(ractive.data.postFilter);
		if (temp.length > ractive.data.displaySettings.maxDisplayed) {
			temp = temp.slice(0, ractive.data.displaySettings.maxDisplayed);
		}
		ractive.data.filteredPosts = temp;
	};

	ractive.data.getDisplayedTextForExtension = function (post) {
        if (!post.extension || post.extension.length == 0) {
            return ""
        } else {
            return "(" + post.extension + ")"
        }
    }

	// Observe filterData property changes to trigger filtering
	ractive.observe("rawFilterData.*", function(oldVal, newVal, keypath) {
		ractive.data.filterUpdateNeeded = true;
	});

	ractive.on("filterDataChange", function(event) {
		// Commit the filter data
		for (var key in ractive.data.rawFilterData) {
			ractive.data.filterData[key] = ractive.data.rawFilterData[key];
		}
		ractive.data.doFiltering();
		ractive.data.filterUpdateNeeded = false;
	});

	// Configure the RedditSearch
	ractive.data.redditSearch.configure({
		queryData: ractive.data.mainQueryData,
		callbacks: {
			updated: function() { 
				ractive.data.doFiltering();
			},
			timedOut: function() { 
				ractive.data.doFiltering();
			}
		}
	});

	// On start event, tell redditSearch to begin
	ractive.on("toggleStart", function(event) {
		if (ractive.data.redditSearch.searchState.inProgress) {
			ractive.data.redditSearch.stopSearch();
			ractive.data.searchInProgress = false;
		} else {
			ractive.data.redditSearch.reset();
			ractive.data.redditSearch.beginSearch();
			ractive.data.searchInProgress = true;
		}
	});

});