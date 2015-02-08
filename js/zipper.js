function zip(first, second){
	var
		result = [];
	
	result[first.length - 1] = null;
	for(var i = 0, size = first.length; i < size; ++i){
		result[i] = {
				first: first[i],
				second: second[i]
		};
	}
	
	return result;
}