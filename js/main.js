var tool;

var settings = JSON.parse(localStorage.getItem("settings")) || {
	_recentCount: 5,
	_handle: "",
	_userStatusCount: 5
};

settings.save = function () {
	localStorage.setItem("settings", JSON.stringify(settings));
};

/*
	It is widely believed that user's input is evil
*/
settings.handle = function (handle) {
	if(typeof handle == 'string') {
		this._handle = handle;
		this.save();
	}
};

settings.recentCount = function (recentCount) {
	if(typeof recentCount == 'number') {
		this._recentCount = (recentCount | 0) || 5;
		this.save();
	}
};

settings.userStatusCount = function (userStatusCount) {
	if(typeof userStatusCount == 'number') {
		this._userStatusCount = (userStatusCount | 0) || 5;
		this.save();
	}
};

document.addEventListener("DOMContentLoaded", function () {
	"use strict";

	tool = (function () {
		var self = {};

		var user = null;

		var RECENT_STATUS = {
			url: "http://codeforces.com/api/problemset.recentStatus",
			jsonp: "tool.fetchRecentStatus",
			status: undefined,
			interval: 30000,
			intervalId: null,
			timeout: 10000,
			timeoutId: null,
			dom: document.querySelector("#recent_status-table tbody"),
			reset: function () {
				if(this.timeoutId != null) {
					clearTimeout(this.timeoutId);
					this.timeoutId = null;
				}
				if(this.intervalId != null) {
					clearInterval(this.intervalId);
					this.intervalId = null;
				}
			}
		};

		var USER_STATUS = {
			url: "http://codeforces.com/api/user.status",
			jsonp: "tool.fetchUserStatus",
			status: undefined,
			interval: 30000,
			intervalId: null,
			timeout: 10000,
			timeoutId: null,
			dom: document.querySelector("#user_status-table tbody"),
			container: document.getElementById("user_status-container"),
			hide: function () {
				this.container.style.display = "none";
			},
			show: function () {
				document.getElementById("handle-placeholder").textContent = user.handle;
				this.container.style.display = "block";
			},
			reset: function () {
				if(this.timeoutId != null) {
					clearTimeout(this.timeoutId);
					this.timeoutId = null;
				}
				if(this.intervalId != null) {
					clearInterval(this.intervalId);
					this.intervalId = null;
				}
			}
		};
		USER_STATUS.hide();

		var USER_INFO =	{
			url: "http://codeforces.com/api/user.info",
			jsonp: "tool.fetchUserInfo",
			status: undefined,
			timeout: 10000,
			timeoutId: null,
			reset: function () {
				if(this.timeoutId != null) {
					clearTimeout(this.timeoutId);
					this.timeoutId = null;
				}
			}
		};

		var PROBLEM_SEARCH = {
			url: "http://codeforces.com/api/problemset.problems",
			jsonp: "tool.fetchProblemSearch",
			status: undefined,
			timeout: 10000,
			timeoutId: null,
			reset: function () {
				if(this.timeoutId != null) {
					clearTimeout(this.timeoutId);
					this.timeoutId = null;
				}
			},
			dom: document.querySelector("#search_result-table tbody"),
			searchResult: []
		};

		var tagList = [];
		var tagField = document.getElementById("tag-field");
		var tagListDom = document.getElementById("tag-list");
		
		function deleteAllRows(el_table) { // works on <tbody> in Firefox!
			while(el_table.rows.length > 0) el_table.deleteRow(-1);
		}

		function formatDate(date) {
			var M = date.getMonth() + 1;
			M = M < 10 ? '0' + M : M;
			var h = date.getHours();
			h = h < 10 ? '0' + h : h;
			var m = date.getMinutes();
			m = m < 10 ? '0' + m : m;
			var s = date.getSeconds();
			s = s < 10 ? '0' + s : s;
			var d = date.getDate();
			d = d < 10 ? '0' + d : d;
			return date.getFullYear() + '-' + M + '-' + date.getDate() + ' ' + h + ':' + m + ':' + s;
		}

		self.fetchRecentStatus = function (response) {
			if(RECENT_STATUS.status == 200
				&& response.status == "OK") {
				deleteAllRows(RECENT_STATUS.dom);
				for(var i = 0, size = response.result.length; i < size; ++i) {
					var entry = response.result[i],
						el_row = RECENT_STATUS.dom.insertRow(-1),
						el_col;
					// Submission ID
					el_col = el_row.insertCell(-1);
					el_col.textContent = entry.id;
					// Contest ID
					// Careful with Gym ID
					el_col = el_row.insertCell(-1);
					if(entry.contestId < 100000) el_col.innerHTML = '<a target="_blank" href="http://codeforces.com/contest/' + entry.contestId + '">' + entry.contestId + '</a>';
					else el_col.innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + entry.contestId + '">' + entry.contestId + '</a>';
					// #
					el_col = el_row.insertCell(-1);
					if(entry.contestId < 100000) {
						el_col.innerHTML = '<a target="_blank" href="http://codeforces.com/contest/' + entry.contestId + '/problem/' + entry.problem.index + '">' + entry.problem.index + '</a>';
					} else {
						el_col.innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + entry.contestId + '/problem/' + entry.problem.index + '">' + entry.problem.index + '</a>';
					}
					// Problem Name
					el_col = el_row.insertCell(-1);
					if(entry.contestId < 100000) {
						el_col.innerHTML = '<a target="_blank" href="http://codeforces.com/contest/' + entry.contestId + '/problem/' + entry.problem.index + '">' + entry.problem.name + '</a>';
					} else {
						el_col.innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + entry.contestId + '/problem/' + entry.problem.index + '">' + entry.problem.name + '</a>';
					}
					// Tags
					el_col = el_row.insertCell(-1);
					el_col.textContent = entry.problem.tags.join(', ');
					// Handle(s?)
					el_col = el_row.insertCell(-1);
					for(var j = 0, size2 = entry.author.members.length; j < size2; ++j) {
						if(j > 0) el_col.innerHTML += ', ';
						var member = entry.author.members[j];
						el_col.innerHTML += '<a target="_blank" href="http://codeforces.com/profile/' + member.handle + '">' + member.handle + '</a>';
					}
					// Submission Date
					el_row.insertCell(-1).textContent = formatDate(new Date(entry.creationTimeSeconds * 1000)); // convert to milliseconds
					// Language
					el_row.insertCell(-1).textContent = entry.programmingLanguage;
					// Verdict
					el_row.insertCell(-1).textContent = entry.verdict;
					// Time (ms)
					el_row.insertCell(-1).textContent = entry.timeConsumedMillis;
					// Memory (byte)
					el_row.insertCell(-1).textContent = entry.memoryConsumedBytes;
				}
			}
		};

		function listenToRecentStatus () {
			RECENT_STATUS.status = 200;

			var el_script = document.createElement("script");

			el_script.src = RECENT_STATUS.url + "?jsonp=" + RECENT_STATUS.jsonp + "&count=" + settings._recentCount;

			document.body.appendChild(el_script); // I don't know what happened
			document.body.removeChild(el_script); // But it works!

			/*
				By common sense, seconds to timeout must be less than or equal to interval time.
				Try to figure this out so that I don't have to explain.
			*/
			RECENT_STATUS.timeoutId = setTimeout(function () {
				RECENT_STATUS.status = undefined; // I don't know what happened, just declare error (not 200)
			}, RECENT_STATUS.timeout);
		}
		listenToRecentStatus();
		RECENT_STATUS.intervalId = setInterval(listenToRecentStatus, RECENT_STATUS.interval);

		self.fetchUserStatus = function (response) {
			if(USER_STATUS.status == 200
				&& response.status == "OK") {
				deleteAllRows(USER_STATUS.dom);
				for(var i = 0, size = response.result.length; i < size; ++i) {
					var entry = response.result[i],
						el_row = USER_STATUS.dom.insertRow(-1),
						el_col;
					// Submission ID
					el_row.insertCell(-1).textContent = entry.id;
					// Contest ID
					if(entry.contestId < 100000) {
						el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/problemset/problem/' + entry.problem.contestId + '">' + entry.problem.contestId + '</a>';
					} else {
						el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + entry.problem.contestId + '">' + entry.problem.contestId + '</a>';
					}
					// #
					if(entry.contestId < 100000) {
						el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/problemset/problem/' + entry.problem.contestId + '/' + entry.problem.index + '">' + entry.problem.index + '</a>';
					} else {
						el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + entry.problem.contestId + '/problem/' + entry.problem.index + '">' + entry.problem.index + '</a>';
					}
					// Problem
					if(entry.contestId < 100000) {
						el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/problemset/problem/' + entry.problem.contestId + '/' + entry.problem.index + '">' + entry.problem.name + '</a>';
					} else {
						el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + entry.problem.contestId + '/problem/' + entry.problem.index + '">' + entry.problem.name + '</a>';
					}
					// Handle
					el_col = el_row.insertCell(-1);
					for(var j = 0, size2 = entry.author.members.length; j < size2; ++j) {
						if(j > 0) el_col.innerHTML += ', ';
						var member = entry.author.members[j];
						el_col.innerHTML += '<a target="_blank" href="http://codeforces.com/profile/' + member.handle + '">' + member.handle + '</a>';
					}
					// Submission Date
					el_row.insertCell(-1).textContent = formatDate(new Date(entry.creationTimeSeconds * 1000));
					// Language
					el_row.insertCell(-1).textContent = entry.programmingLanguage;
					// Verdict
					el_row.insertCell(-1).textContent = entry.verdict;
					// Time (ms)
					el_row.insertCell(-1).textContent = entry.timeConsumedMillis;
					// Memory (byte)
					el_row.insertCell(-1).textContent = entry.memoryConsumedBytes;
				}
			}
		};

		function listenToUserStatus() {
			USER_STATUS.status = 200;

			var el_script = document.createElement('script');

			el_script.src = USER_STATUS.url + '?jsonp=tool.fetchUserStatus&from=1&handle=' + user.handle + '&count=' + settings._userStatusCount;

			document.body.appendChild(el_script);
			document.body.removeChild(el_script);

			USER_STATUS.timeoutId = setTimeout(function () {
				USER_STATUS.status = undefined;
			}, USER_STATUS.timeout);
		}

		self.fetchUserInfo = function (response) {
			if(USER_INFO.status == 200
				&& response.status == "OK") {
				user = response.result[0]; // expect only 1 result, no more no less
				
				listenToUserStatus();
				USER_STATUS.intervalId = setInterval(listenToUserStatus, USER_STATUS.interval);
				USER_STATUS.show();
			}
		};

		function loadUserInfo() {
			if(settings._handle) { // non-empty string or not null
				USER_INFO.reset();
				USER_STATUS.reset();

				USER_INFO.status = 200;

				var el_script = document.createElement("script");

				el_script.src = USER_INFO.url + '?jsonp=tool.fetchUserInfo&handles=' + settings._handle;

				document.body.appendChild(el_script);
				document.body.removeChild(el_script);

				USER_INFO.timeoutId = setTimeout(function () {
					// This is only detected if the request timeout before HTTP OK
					USER_INFO.status = undefined; // Delcare failed (not 200, something else)
				}, USER_INFO.timeout);
			}
		}

		document.getElementById("handle-field").addEventListener('keyup', function (event) {
			switch(event.keyCode) {
				case 13: case '13':
					settings.handle(this.value); // this should refer to the <input> element
					loadUserInfo();
					break;
			}
		});

		document.getElementById("submit_handle-btn").addEventListener('click', function (event) {
			settings.handle(document.getElementById("handle-field").value);
			loadUserInfo();
		});

		for(var elList = document.querySelectorAll('.recent_status-count'), i = 0, size = elList.length; i < size; ++i) {
			var el = elList[i];
			el.addEventListener('click', function (event) {
				RECENT_STATUS.reset();
				
				var count = parseInt(this.getAttribute('data-recent-count'), 10) || 5;
				settings.recentCount(count);

				listenToRecentStatus();
				RECENT_STATUS.intervalId = setInterval(listenToRecentStatus, RECENT_STATUS.interval);
			});
		}

		for(var elList = document.querySelectorAll('.user_status-count'), i = 0, size = elList.length; i < size; ++i) {
			var el = elList[i];
			el.addEventListener('click', function (event) {
				USER_STATUS.reset();

				var count = parseInt(this.getAttribute('data-user-status-count'), 10) || 5;
				settings.userStatusCount(count);

				listenToUserStatus();
				USER_STATUS.intervalId = setInterval(listenToUserStatus, USER_STATUS.interval);
			});
		}

		function addTag(tag) {
			if(tag != "" && tagList.indexOf(tag) == -1) {
				tagList.push(tag);

				var el = document.createElement('a');
				el.classList.add('tag');
				el.textContent = tag;

				tagListDom.appendChild(el);

				el.addEventListener('click', function (event) {
					var idx = tagList.indexOf(tag);
					tagList.splice(idx, 1);

					tagListDom.removeChild(el);
				});
			}
		}

		tagField.addEventListener('keyup', function (event) {
			switch(event.keyCode) {
				case 13: case '13':
					addTag(this.value);
					this.select();
					break;
			}
		});

		document.getElementById("add_tag-btn").addEventListener('click', function (event) {
			addTag(tagField.value);
			tagField.select();
		});

		function displayProblemList() {
			deleteAllRows(PROBLEM_SEARCH.dom);
			var problemList = PROBLEM_SEARCH.searchResult;

			for(var i = 0, size = problemList.length; i < size; ++i) {
				var problem = problemList[i];

				var el_row = PROBLEM_SEARCH.dom.insertRow(-1),
					el_col;

				// Contest ID
				if(problem.contestId < 100000)
					el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/contest/' + problem.contestId + '">' + problem.contestId + '</a>';
				else
					el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + problem.contestId + '">' + problem.contestId + '</a>';
				// #
				if(problem.contestId < 100000)
					el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/contest/' + problem.contestId + '/problem/' + problem.index +'">' + problem.index + '</a>';
				else
					el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + problem.contestId + '/problem/' + problem.index + '">' + problem.index + '</a>';
				// Problem Name
				if(problem.contestId < 100000)
					el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/contest/' + problem.contestId + '/problem/' + problem.index +'">' + problem.name + '</a>';
				else
					el_row.insertCell(-1).innerHTML = '<a target="_blank" href="http://codeforces.com/gym/' + problem.contestId + '/problem/' + problem.index + '">' + problem.name + '</a>';						
				// Tags
				el_row.insertCell(-1).textContent = problem.tags.join(", ");
				// Solved Count
				el_row.insertCell(-1).textContent = problem.solvedCount;
			}
		}

		self.fetchProblemSearch = function (response) {
			if(PROBLEM_SEARCH.status == 200
				&& response.status == "OK") {
				
				var problemList = PROBLEM_SEARCH.searchResult = [];
				for(var i = 0, size = response.result.problems.length; i < size; ++i) {
					var problem = response.result.problems[i];
					var statistic = response.result.problemStatistics[i];

					var problemWithStat = JSON.parse(JSON.stringify(problem));
					problemWithStat.solvedCount = statistic.solvedCount;

					problemList.push(problemWithStat);
				}

				displayProblemList();
			}
		};

		function submitTagList() {
			PROBLEM_SEARCH.reset();
			PROBLEM_SEARCH.status = 200;

			var el_script = document.createElement('script');

			el_script.src = PROBLEM_SEARCH.url + '?jsonp=tool.fetchProblemSearch&tags=' + tagList.join(';');

			document.body.appendChild(el_script);
			document.body.removeChild(el_script); // This just works

			PROBLEM_SEARCH.timeoutId = setTimeout(function () {
				PROBLEM_SEARCH.status = undefined;
			}, PROBLEM_SEARCH.timeout);
		}

		document.getElementById("submit_tag_list-btn").addEventListener('click', submitTagList);

		function compareBySolvedCount(a, b) {
			return b.solvedCount - a.solvedCount;
		}

		function compareByAlphanum(a, b) {
			return a.name <= b.name ? -1 : 1;
		}

		document.getElementById("sort_by_alphanum-btn").addEventListener('click', function (event) {
			PROBLEM_SEARCH.searchResult.sort(compareByAlphanum);
			displayProblemList();
		});

		document.getElementById("sort_by_solvedcount-btn").addEventListener('click', function (event) {
			PROBLEM_SEARCH.searchResult.sort(compareBySolvedCount);
			displayProblemList();
		});

		return self;
	}());
});