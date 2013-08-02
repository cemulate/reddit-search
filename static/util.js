util = {

	softIndexOf: function (value, array, equality) {
		for (var i = 0; i < array.length; i ++) {
			if (equality(value, array[i])) {
				return i
			}
		}
		return -1
	}

}