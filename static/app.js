$.ajax("static/appTemplate.html").then(function(appTemplate) {

	var initFilterData = {
		subreddit: '',
		title: '',
		domain: '',
		op: '',
		extension: ''
	};

	var afterRender = function () {
		
		// Setup delayed searching. This makes sure that when rawFilterData is changed by
		// the user, the page will wait until they 'stop typing' before committing 
		// rawFilterData to filterData, which will trigger Ractive to filter and update

		var self = this; // the Ractive

		var commit = function () {
			// Commit rawFilterData to filterData -- ractive will now update the template
			self.set("filterData", JSON.parse(JSON.stringify(self.get("rawFilterData"))));
		}

		// https://github.com/dennyferra/TypeWatch
		$(".rawFilterData-text").typeWatch({
			callback: commit,
			wait: 300,
			highlight: true,
			captureLength: 0
		});
	};

	var ractive = new Ractive({
		magic: false,
		el: 'appContainer',
		template: appTemplate,
		data: {
			mainQueryData: {
				username: '',
				userpage: 'liked'
			},
			rawFilterData: JSON.parse(JSON.stringify(initFilterData)),
			filterData: JSON.parse(JSON.stringify(initFilterData)),
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
		onrender: afterRender
	});

	var postFilter = function (x) {
		return (x.subreddit.indexOf(ractive.get("filterData.subreddit")) > -1) &&
			   (x.title.toLowerCase().indexOf(ractive.get("filterData.title").toLowerCase()) > -1) &&
			   (x.domain.indexOf(ractive.get("filterData.domain")) > -1) &&
			   (x.op.toLowerCase().indexOf(ractive.get("filterData.op").toLowerCase()) > -1) &&
			   (x.extension.indexOf(ractive.get("filterData.extension")) > -1);
	};

	var doFiltering = function() {
		var temp = ractive.get("redditSearch.posts").filter(postFilter);
		if (temp.length > ractive.get("displaySettings.maxDisplayed")) {
			temp = temp.slice(0, ractive.get("displaySettings.maxDisplayed"));
		}
		ractive.set("filteredPosts", temp);
	};

	ractive.observe("filterData", function(oldVal, newVal, keypath) {
		doFiltering();
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