function cf_parse(response){
	alert(response.status);
	
	if(response.status == 'OK'){
		var
			p_list = response.result.problems,
			p_stats = response.result.problemStatistics,
			p_link = 'http://codeforces.com/problemset/problem/',
			sort_btns = [document.createElement('a'),
					document.createElement('a')],
			sub_container = document.createElement('div'),
			complete_list = zip(p_list, p_stats);
		
		function cf_display(){
			var
				list = document.createElement('ul');
			
			for(var i = 0, size = complete_list.length; i < size; ++i){
				var
					prob = complete_list[i].first,
					stat = complete_list[i].second,
					anchor = document.createElement('a'),
					item = document.createElement('li'),
					span = document.createElement('span');
				
				anchor.href = p_link + prob.contestId + '/' + prob.index;
				anchor.textContent = prob.name;
				anchor.target = '_blank';
				
				span.textContent = stat.solvedCount;
				span.style.color = '#0f0';
				
				item.appendChild(anchor);
				
				// do not use innerHTML
				item.appendChild(document.createTextNode(' ('));
				item.appendChild(span);
				item.appendChild(document.createTextNode(')'));
				
				list.appendChild(item);
			}
			
			sub_container.appendChild(list);
		}
		
		sort_btns[0].textContent = 'A/z';
		sort_btns[0].href = '#';
		
		sort_btns[1].textContent = 'Solve count';
		sort_btns[1].href = '#';
		
		sort_btns[0].onclick = function (e){
			complete_list.sort(function (a, b){
				var
					prob_a = a.first,
					prob_b = b.first;
				
				if(prob_a.name < prob_b.name){
					return -1;
				} else if(prob_a.name == prob_b.name){
					return 0;
				} else{
					return 1;
				}
			});
			
			remove_children(sub_container);
			cf_display();
		};
		
		sort_btns[1].onclick = function (e){
			complete_list.sort(function (a, b){
				var
					stat_a = a.second,
					stat_b = b.second;
				
				if(typeof stat_a.solvedCount == 'string')
					throw new Error();
				
				return stat_b.solvedCount - stat_a.solvedCount;
			});
			
			remove_children(sub_container);
			cf_display();
		};
		
		cf_display();
		
		res_container.appendChild(sort_btns[0]);
		
		// fucking shit innerHTML unstable
		// res_container.innerHTML += ' ';
		res_container.appendChild(document.createTextNode(' '));
		
		res_container.appendChild(sort_btns[1]);
		res_container.appendChild(sub_container);
	}
};

function cf(p_tag, search_btn, res_container){
	search_btn.onclick = function (e){
		remove_children(res_container);
		
		var
			jsonp = document.getElementById('jsonp_cf'),
			tag_arr = p_tag.value.split(',');
		
		if(jsonp){
			jsonp_container.removeChild(jsonp);
			jsonp = null;
		}
		
		jsonp = jsonp_container.appendChild(document.createElement('script'));
		jsonp.id = 'jsonp_cf';
		
		for(var key in tag_arr){
			tag_arr[key].trim();
		}
		
		jsonp.type = 'text/javascript';
		jsonp.src = 'http://codeforces.com/api/problemset.problems?tags='
				+ tag_arr.join(';') + '&jsonp=cf_parse';
	};
}