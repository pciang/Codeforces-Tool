var
	oj_selector,
	p_tag,
	p_tag_row,
	search_btn,
	search_btn_row,
	res_container,
	res_row,
	jsonp_container;

function remove_children(ele){
	var firstChild;
	while(firstChild = ele.firstChild)
		ele.removeChild(ele.firstChild);
}

document.addEventListener('DOMContentLoaded', function (arg){
	p_tag = document.getElementById('p_tag'),
	search_btn = document.getElementById('search_btn'),
	oj_selector = document.getElementById('oj_selector'),
	res_container = document.getElementById('res_container');
	
	res_row = document.getElementById('res_row');
	p_tag_row = document.getElementById('p_tag_row');
	search_btn_row = document.getElementById('search_btn_row');
	
	jsonp_container = document.getElementById('jsonp_container');
	
	function reset(){
		p_tag_row.style.visibility
				= search_btn_row.style.visibility
				= res_row.style.visibility = 'collapse';
		
		p_tag.value = "";
		remove_children(res_container);
	};

	// opposite of reset()
	function show(arr){
		for(var key in arr){
			arr[key].style.visibility = 'visible';
		}
	};
	
	reset();
	
	oj_selector[0].selected = true;
	oj_selector.onchange = function (){
		reset();
		switch(this.value){
			case 'cf':
				p_tag.value = 'dp,math,implementation';
				show([p_tag_row, search_btn_row, res_row]);
				cf(p_tag, search_btn, res_container);
				break;
		}
	};
});