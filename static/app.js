$.ajax("static/appTemplate.html").then(function(appTemplate) {

	var ractive = new Ractive({
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
			},
			getDisplayedTextForExtension: function (post) {
				if (post == null) {
					return "";
				}
				if (!post.extension || post.extension.length == 0) {
					return "";
				} else {
					return "(" + post.extension + ")";
				}
			}
		},
		magic: false
	});

	// Observe filterData property changes to trigger filtering
	ractive.observe("rawFilterData.*", function(oldVal, newVal, keypath) {
		this.set("filterUpdateNeeded", true);
	});

	var postFilter = function (x) {
		return (x.subreddit.indexOf(ractive.get("filterData.subreddit")) > -1) &&
			   (x.title.toLowerCase().indexOf(ractive.get("filterData.title").toLowerCase()) > -1) &&
			   (x.domain.indexOf(ractive.get("filterData.domain")) > -1) &&
			   (x.op.toLowerCase().indexOf(ractive.get("filterData.op").toLowerCase()) > -1) &&
			   (x.extension.indexOf(ractive.get("filterData.extension")) > -1);
	}

	var doFiltering = function() {
		var temp = ractive.get("redditSearch.posts").filter(postFilter);
		if (temp.length > ractive.get("displaySettings.maxDisplayed")) {
			temp = temp.slice(0, ractive.get("displaySettings.maxDisplayed"));
		}
		ractive.set("filteredPosts", temp);
	}

	ractive.on("filterDataChange", function(event) {
		// Commit the filter data
		var rawFilterData = this.get("rawFilterData");
		for (var key in rawFilterData) {
			this.set("filterData." + key, rawFilterData[key]);
		}

		doFiltering();
		
		this.set("filterUpdateNeeded", false);
	});

	// Configure the RedditSearch
	ractive.get("redditSearch").configure({
		queryData: ractive.get("mainQueryData"),
		callbacks: {
			updated: function () {
				doFiltering();
				ractive.update("redditSearch.searchState");
			},
			timedOut: function () {
				doFiltering();
				ractive.update("redditSearch.searchState");
			}
		}
	});

	// On start event, tell redditSearch to begin
	ractive.on("toggleStart", function(event) {
		if (this.get("redditSearch.searchState.inProgress")) {
			this.get("redditSearch").stopSearch();
			this.update("redditSearch.searchState");
		} else {
			this.set("filteredPosts", []);
			this.get("redditSearch").reset();
			this.get("redditSearch").beginSearch();
			this.update("redditSearch.searchState");
		}
	});

	console.log(ractive);

});