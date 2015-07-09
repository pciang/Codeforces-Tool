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

	// error_callback is optional
	function JSONP(url, success_callback, error_callback) {
		var self = this;

		var timeout_ms = 10000;
		var timeoutId = undefined;

		var interval_ms = 15000;
		var intervalId = undefined;

		var request = null;

		var status = 'stopped';
		
		function send() {
			status = 'waiting';

			request = $.ajax({
				url: url,

				// The name of the callback parameter, as specified by the YQL service
				jsonp: "jsonp",

				// Tell jQuery we're expecting JSONP
				dataType: "jsonp",

				timeout: 10000,

				// Work with the response
				success: function (response) {
					status = 'success';
					success_callback(response);
				},

				error: function (jqXHR, textStatus, errorThrown) {
					status = 'error';

					if(typeof error_callback == 'function') {
						error_callback(jqXHR, textStatus, errorThrown);
					}
				}
			});

			timeoutId = setTimeout(function () {
				request.abort(); // will not trigger error if succeeded
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}, timeout_ms);
		}

		this.start = function () {
			if(status == 'stopped') {
				send();
				intervalId = setInterval(send, interval_ms);
			}
		};

		this.stop = function () {
			if(request != null) {
				request.abort();
				request = null;

				if(timeoutId != undefined) {
					clearTimeout(timeoutId);
					timeoutId = undefined;
				}

				clearInterval(intervalId);
				intervalId = undefined;
			}

			status = 'stopped';
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
					// event.stopPropagation();
					if(typeof self.onclick == 'function') self.onclick(event);
				}
			})
			// .attr('href', '#')
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
				if(last != null) {
					this.showRecent = last.showRecent;
					this.handle = last.handle;
					this.showStatus = last.showStatus;
				}
			}
		};
		settings.load();

		tools.showRecent = function (n) {
			if(!isNaN(n)) {
				settings.showRecent = Math.min(Math.max(5, n | 0), 50);
				settings.save();
			}
			return settings.showRecent;
		};

		tools.handle = function (h) {
			if(typeof h == 'string' || h instanceof String) {
				settings.handle = h;
				settings.save();
			}
			return settings.handle;
		};

		tools.showStatus = function (n) {
			if(!isNaN(n)) {
				settings.showStatus = Math.min(Math.max(5, n | 0), 50);
				settings.save();
			}
			return settings.showStatus;
		};

		return tools;
	}();

	var recent = function () {
		var recent = {};

		var container = document.getElementById('recent-container');

		var base_url = protocol + '//codeforces.com/api/problemset.recentStatus?count=';

		var counter = 0;

		var jsonp = new JSONP(base_url + tools.showRecent(), function (response) {
			if(jsonp.status() == 'success' && response.status == 'OK') {
				recent.clear();
				response.result.forEach(function (entry) {
					recent.add(entry);
				});
			}
		});
		jsonp.start();

		recent.add = function (sample_element, data) {
			var el = sample_element.cloneNode(true);
			$(el).attr('data-recent-entry', counter++);
			$(el).find('[data-col="submission-id"]').text(data.id);
			$(el).find('[data-col="verdict"]').text(data.verdict);
			$(el).find('[data-col="memory-byte"]').text(data.memoryConsumedBytes);
			$(el).find('[data-col="time-ms"]').text(data.timeConsumedMillis);
			$(el).find('[data-col="submission-date"]')
				.text(DateFormat.format.date(new Date(data.creationTimeSeconds * 1000), 'yyyy-MM-dd HH:mm:ss'));

			var problem_url;
			if(data.contestId < 100000) {
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
			$(container).find('[data-recent-entry]')
				.remove();
		};

		recent.update = function () {
			jsonp.stop();
			jsonp.url(base_url + tools.showRecent());
			jsonp.start();
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
			if(tag != '' && selected.indexOf(tag) == -1) {
				selected.push(tag);

				var t = new Tag(tag);
				t.onclick = function (event) {
					tags.remove(tag);
					selected_el.removeChild(event.target);
				};

				selected_el.appendChild(t.el());
			}
		};

		tags.toString = function () {
			return selected.join(';');
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

		var complete_url = protocol + '//codeforces.com/api/user.status?handle=&from=1&count=';

		var counter = 0;

		var handle_checker = /^[-_a-zA-Z0-9]{3,24}$/;

		var jsonp = new JSONP(complete_url, function (response) {
			if(response.status == 'FAILED') {
				tools.handle('');
				jsonp.stop();
			} else if(jsonp.status() == 'success' && response.status == 'OK') {
				status.clear();
				response.result.forEach(function (entry) {
					status.add(entry);
				});
			}
		}, function (jqXHR, textStatus, errorThrown) {
			if(textStatus == 'abort' || textStatus == 'timeout') {
				tools.handle('');
				jsonp.stop();
			}
		});

		status.update = function () {
			complete_url = complete_url.replace(/(handle=)[^&]*(&)?/, '$1' + tools.handle() + '$2');
			complete_url = complete_url.replace(/(count=)[^&]*(&)?/, '$1' + tools.showStatus() + '$2');

			jsonp.stop();
			jsonp.url(complete_url);
			if(handle_checker.test(tools.handle())) jsonp.start();
		};
		status.update();

		status.clear = function () {
			counter = 0;
			$(container).find('[data-status-entry]')
				.remove();
		};

		status.add = function (sample_element, data) {
			var el = sample_element.cloneNode(true);
			$(el).find('[data-col="submission-id"]').text(data.id);
			$(el).find('[data-col="submission-date"]')
				.text(DateFormat.format.date(new Date(data.creationTimeSeconds * 1000), 'yyyy-MM-dd HH:mm:ss'));
			$(el).find('[data-col="language"]').text(data.programmingLanguage);
			$(el).find('[data-col="verdict"]').text(data.verdict);
			$(el).find('[data-col="time-ms"]').text(data.timeConsumedMillis);
			$(el).find('[data-col="memory-byte"]').text(data.memoryConsumedBytes);

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

			$(container).append(el);
		}.bind(status, $('#status-container [data-status-entry]').detach()[0]);

		return status;
	}();

	$('[data-show-recent]').on('click', function (event) {
		tools.showRecent($(this).attr('data-show-recent'));
		recent.update();
	});

	var tag_checker = /^[- a-zA-Z0-9]{1,16}$/;
	$('#tag-field')
		.on('keyup', function (event) {
			if(event.keyCode == 13) {
				if(tag_checker.test(this.value)) {
					this.select();
					tags.add(this.value);
				}
			}
		});
	$('#add-tag-btn')
		.on('click', function (event) {
			var t = $('#tag-field').select().val();
			if(tag_checker.test(t)) {
				tags.add(t);
			}
		});

	var handle_checker = /^[-_a-zA-Z0-9]{3,24}$/;
	$('#handle-field')
		.on('keyup', function (event) {
			if(event.keyCode == 13) {
				if(handle_checker.test(this.value)) {
					this.blur();
					tools.handle(this.value);
					status.update();
				}
			}
		});
	$('#handle-submit')
		.on('click', function (event){
			var h = $('#handle-field').val();
			if(handle_checker.test(h)) {
				tools.handle(h);
				status.update();
			}
		});
	
	$('[data-show-status]').on('click', function (event) {
		tools.showStatus($(this).attr('data-show-status'));
		status.update();
	});

	var search = function () {
		var search = {};

		var base_url = protocol + '//codeforces.com/api/problemset.problems?tags=';

		var result = [];

		var container = document.getElementById('search-result');

		function zip(a, b) {
			if(a.length != b.length) throw "Both arrays have different length!";

			var res = [];
			for(var i = 0, size = a.length; i < size; ++i) {
				a[i].solvedCount = b[i].solvedCount;
				res.push(a[i]);
			}
			return res;
		}

		// comparison_function is optional
		search.display = function (sample_element, comparison_function) {
			if(typeof comparison_function == 'function') {
				result.sort(comparison_function);
			}

			$(container).find('[data-search-entry]').remove();
			result.forEach(function (entry) {
				var el = sample_element.cloneNode(true);
				$(el).find('[data-col="solved-count"]').text(entry.solvedCount);

				var problem_url;
				if(entry['contestId'] < 100000) {
					problem_url = 'http://codeforces.com/contest/' + entry.contestId + '/';
				}
				else {
					problem_url = 'http://codeforces.com/gym/' + entry.contestId + '/';
				}

				$(el).find('[data-col="contest-id"] a')
					.attr('href', problem_url)
					.text(entry.contestId);

				problem_url += 'problem/' + entry.index;
				$(el).find('[data-col="problem-index"] a')
					.attr('href', problem_url)
					.text(entry.index);

				$(el).find('[data-col="problem-name"] a')
					.attr('href', problem_url)
					.text(entry.name);

				entry.tags.forEach(function (tag) {
					var t = new Tag(tag);
					t.onclick = function (event) {
						tags.add(tag);
					};
					t.el().textContent = tag;

					$(el).find('[data-col="problem-tags"]')
						.append(t.el());
				});

				$(container).append(el);
			})
		}.bind(search, $('[data-search-entry]').detach()[0]);

		search.go = function () {
			var jsonp = $.ajax({
				url: base_url + tags.toString(),

				// The name of the callback parameter, as specified by the YQL service
				jsonp: "jsonp",

				// Tell jQuery we're expecting JSONP
				dataType: "jsonp",

				timeout: 10000,

				// Work with the response
				success: function (response) {
					if(response.status == 'OK') {
						result = zip(response.result.problems, response.result.problemStatistics);
						search.display();
					}
				}
			});
		};

		return search;
	}();

	$('#search-problem-btn').on('click', function (event) {
		search.go();
	})

	$('[data-sort-by="character"]').on('click', function (event) {
		search.display(function (a, b) {
			return a.name <= b.name ? -1 : 1;
		});
	});

	$('[data-sort-by="solved-count"]').on('click', function (event) {
		search.display(function (a, b) {
			return b.solvedCount - a.solvedCount;
		});
	});

});