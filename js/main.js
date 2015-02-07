var
	selector,
	p_tag,
	search_btn,
	res_container;

function display(response){
	alert(response.status);
	
	if(response.status == 'OK'){
		var
			list = document.createElement('ul');
			p_list = response.result.problems,
			p_stats = response.result.problemStatistics,
			p_link = 'http://codeforces.com/problemset/problem/';
		
		for(var i = 0, size = p_list.length; i < size; ++i){
			var
				p = p_list[i],
				a = document.createElement('a'),
				li = document.createElement('li'),
				span = document.createElement('span');
			
			a.href = p_link + p.contestId + '/' + p.index;
			a.textContent = p.name;
			a.target = '_blank';
			
			span.textContent = p_stats[i].solvedCount;
			span.style.color = '#0f0';
			
			li.appendChild(a);
			
			li.innerHTML += ' (';
			li.appendChild(span);
			li.innerHTML += ')';
			
			list.appendChild(li);
		}
		
		res_container.appendChild(list);
	}
}

function clear(ele){
	var firstChild;
	while(firstChild = ele.firstChild)
		ele.removeChild(ele.firstChild);
}

function reset(){
	p_tag.parentNode.parentNode.style.visibility = 'collapse';
	search_btn.parentNode.parentNode.style.visibility = 'collapse';
	res_container.parentNode.parentNode.style.visibility = 'collapse';
	
	p_tag.value = "";
	clear(res_container);
};

function show(arr){
	for(var key in arr){
		arr[key].parentNode.parentNode.style.visibility = 'visible';
	}
};

document.addEventListener('DOMContentLoaded', function (arg){
	selector = document.getElementById('selector'),
	p_tag = document.getElementById('p_tag'),
	search_btn = document.getElementById('search_btn'),
	res_container = document.getElementById('res_container');
	
	reset();
	
	selector[0].selected = true;
	selector.onchange = function (){
		reset();
		switch(this.value){
			case 'cf':
				p_tag.value = 'dp,math,implementation';
				show([p_tag, search_btn, res_container]);
				new cf(p_tag, search_btn, res_container);
				break;
		}
	};
});