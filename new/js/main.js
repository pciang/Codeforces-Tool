var tools;

var protocol;

switch(location.protocol) {
	case 'http:':
	case 'https:':
		protocol = location.protocol;
		break;
	default:
		protocol = 'http:';
		break;
}

$(function () {
	"use strict";
	function JSONP(url) {
		var self = this;

		var timeout = 10000; // milliseconds
		var timeoutId = undefined;

		var interval = 15000; // milliseconds
		var intervalId = undefined;

		var status = 'stopped';

		function fetch() {
			status = 'waiting';

			var script_el = document.createElement('script');
			script_el.src = url;
			document.body.appendChild(script_el);
			document.body.removeChild(script_el);

			timeoutId = setTimeout(function () {
				status = 'failed';
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}, timeout);
		}

		this.start = function () {
			fetch();
			intervalId = setInterval(fetch, interval);
		};

		this.stop = function () {
			status = 'stopped';

			if(intervalId != undefined) {
				clearInterval(intervalId);
				intervalId = undefined;
			}

			if(timeoutId != undefined) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
		};

		this.url = function (new_url) {
			if(typeof new_url == 'string' || new_url instanceof String) {
				url = new_url;
			}
			return url;
		};

		this.status = function () {
			return status;
		};
	}

	function Tag(tag) {
		var self = this;

		// much faster than $('<a/>') or $('<a></a>')
		var el = document.createElement('a');
		$(el).addClass('tag no-select')
			.on({
				click: function (event) {
					event.stopPropagation();
					if(typeof self.onclick == 'function') self.onclick(event);
				}
			})
			.text(tag);

		this.el = function () {
			return el;
		};

		this.tag = function () {
			return tag;
		};
	}

	tools = function () {
		var tools = {};

		var settings = {
			showRecent: 5,
			handle: "",
			showStatus: 5,
			save: function () {
				localStorage.setItem('settings', JSON.stringify(this));
			},
			load: function () {
				var last = JSON.parse(localStorage.getItem('settings'));
				
				// no filter
				this.showRecent = last.showRecent;
				this.handle = last.handle;
				this.showStatus = last.showStatus;
			}
		};
		settings.load();

		tools.showRecent = function (n) {
			if(!isNaN(n)) {
				settings.showRecent = Math.min(Math.max(5, n | 0), 50);
				settings.save();
				recent.update();
			}
			return settings.showRecent;
		};

		tools.handle = function (h) {
			if(typeof h == 'string' || h instanceof String) {
				settings.handle = h;
				settings.save();
				status.update();
			}
			return settings.handle;
		};

		tools.showStatus = function (n) {
			if(!isNaN(n)) {
				settings.showStatus = Math.min(Math.max(5, n | 0), 50);
				settings.save();
				status.update();
			}
			return settings.showStatus;
		};

		$('[data-show-recent]').on('click', function (event) {
			tools.showRecent($(event.target).attr('data-show-recent'));
		});

		tools.loadRecent = function (response) {
			console.log(response);

			if(recent.request().status() == 'waiting' && response.status == 'OK') {
				recent.clear();
				response.result.forEach(function (entry) { recent.add(entry); });
			}
		};

		var tag_checker = /[- a-zA-Z0-9]/;
		$('#tag-field')
			.on('keydown', function (event) {
				if(event.keyCode != 8 && !tag_checker.test(String.fromCharCode(event.keyCode))) event.preventDefault();
			})
			.on('keyup', function (event) {
				if(event.keyCode == 13) {
					tags.add(this.value);
					this.select();
				}
			});

		tools.loadStatus = function (response) {
			if(response.status == 'FAILED') {
				status.request().stop();
			} else if(status.request().status() == 'waiting' && response.status == 'OK') {
				console.log(response);
			}
		};

		return tools;
	}();

	var recent = function () {
		var recent = {};

		var container = document.getElementById('recent-container');

		var base_url = protocol + '//codeforces.com/api/problemset.recentStatus?jsonp=tools.loadRecent&count=';

		var jsonp = new JSONP(base_url + tools.showRecent());
		jsonp.start();

		var counter = 0;

		recent.add = function (sample_element, data) {
			var el = sample_element.cloneNode(true);
			$(el).attr('data-recent-entry', counter++);
			$(el).find('[data-col="submission-id"]').text(data.id);
			$(el).find('[data-col="verdict"]').text(data.verdict);
			$(el).find('[data-col="memory-byte"]').text(data.memoryCosumedBytes);
			$(el).find('[data-col="time-ms"]').text(data.timeConsumedMillis);
			$(el).find('[data-col="submission-date"]')
				.text(DateFormat.format.date(new Date(data.creationTimeSeconds * 1000), 'yyyy-MM-dd HH:mm:ss'));

			var problem_url;
			if(data['contestId'] < 100000) {
				problem_url = 'http://codeforces.com/contest/' + data.contestId + '/';
			}
			else {
				problem_url = 'http://codeforces.com/gym/' + data.contestId + '/';
			}

			$(el).find('[data-col="contest-id"] a')
				.attr('href', problem_url)
				.text(data.contestId);

			problem_url += 'problem/' + data.problem.index;
			$(el).find('[data-col="problem-index"] a')
				.attr('href', problem_url)
				.text(data.problem.index);

			$(el).find('[data-col="problem-name"] a')
				.attr('href', problem_url)
				.text(data.problem.name);

			data.problem.tags.forEach(function (tag) {
				var t = new Tag(tag);
				t.onclick = function (event) {
					tags.add(tag);
				};
				t.el().textContent = tag;

				$(el).find('[data-col="problem-tags"]')
					.append(t.el());
			});

			data.author.members.forEach(function (member) {
				var a = document.createElement('a');
				$(a).addClass('handle no-select')
					.attr({
						'target': '_blank',
						'href': 'http://codeforces.com/profile/' + member.handle
					})
					.text(member.handle);
				$(el).find('[data-col="handle"]')
					.append(a);
			});

			container.appendChild(el);
		}.bind(recent, $('#recent-container [data-recent-entry]').detach()[0]);

		recent.clear = function () {
			counter = 0;
			$('#recent-container [data-recent-entry]').remove();
		};

		recent.update = function () {
			jsonp.stop();
			jsonp.url(base_url + tools.showRecent());
			jsonp.start();
		};

		recent.request = function () {
			return jsonp;
		};

		return recent;
	}();

	var tags = function () {
		var tags = {};

		var selected = [];
		var selected_el = document.getElementById('selected-tags');

		tags.remove = function (tag) {
			var idx = selected.indexOf(tag);
			if(idx > -1) selected.splice(idx, 1);
		};

		tags.add = function (tag) {
			if(selected.indexOf(tag) == -1) {
				selected.push(tag);

				var t = new Tag(tag);
				t.onclick = function (event) {
					tags.remove(tag);
					selected_el.removeChild(event.target);
				};

				selected_el.appendChild(t.el());
			}
		};

		var available = ["constructive algorithms","greedy","implementation","graphs","brute force","dp","math","bitmasks","strings","binary search","sortings","divide and conquer","games","data structures","string suffix structures","dfs and similar","number theory","dsu","flows","shortest paths","trees","hashing","probabilities","2-sat","geometry","meet-in-the-middle","two pointers","fft","combinatorics","ternary search","matrices","graph matchings","schedules","chinese remainder theorem","expression parsing"];
		var available_el = document.getElementById('available-tags');

		available.forEach(function (tag) {
			var t = new Tag(tag);
			t.onclick = function (event) {
				tags.add(tag);
			};
			
			available_el.appendChild(t.el());
		});

		return tags;
	}();

	var status = function () {
		var status = {};

		var container = document.getElementById('status-container');

		var complete_url = protocol + '//codeforces.com/api/user.status?jsonp=tools.loadStatus&handle=&from=1&count=';

		var jsonp = new JSONP(complete_url);

		status.update = function () {
			complete_url = complete_url.replace(/(handle=)[^&]*(&)?/, '$1' + tools.handle() + '$2');
			complete_url = complete_url.replace(/(count=)[^&]*(&)?/, '$1' + tools.showStatus() + '$2');
			jsonp.stop();
			jsonp.url(complete_url);
			if(tools.handle() != "") jsonp.start();
		};

		status.add = function (sample_element, data) {

		}.bind(status, $('#status-container [data-status-entry]').detach()[0]);

		status.request = function () {
			return jsonp;
		};

		return status;
	}();

});