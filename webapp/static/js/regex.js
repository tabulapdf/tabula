var _counter = 1;

function addRegex() {
   	_counter++;
    var oClone = document.getElementById("template").cloneNode(true);
    oClone.id += (_counter + "");
    document.getElementById("placeholder").appendChild(oClone);
}

function removeRegex(input) {
    document.getElementById("placeholder").removeChild(input.parentNode);
    _counter--;
}

function finishRegex(){
	var Rbottoms = [];
	var RTops = [];
	for (var i = 0; i < _counter; i++) {
		RTops[i] = document.getElementsByName("regex-top")[i].value;
	}
	for (var i = 0; i <_counter; i++) {
		Rbottoms[i] = document.getElementsByName("regex-bottom")[i].value;
	}
}