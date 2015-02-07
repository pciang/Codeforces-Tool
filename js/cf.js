function cf(p_tag, search_btn, res_container){
	search_btn.onclick = function (e){
		var
			tag_arr = p_tag.value.split(','),
			jsonp = document.getElementById('jsonp');
		
		for(var key in tag_arr){
			tag_arr[key].trim();
		}
		
		jsonp.src = 'http://codeforces.com/api/problemset.problems?tags='
				+ tag_arr.join(';') + '&jsonp=display';
	};
}