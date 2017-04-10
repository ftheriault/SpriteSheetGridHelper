var cols = 0;
var rows = 0;
var width = 0;
var height = 0;

var imgRaw = new Image();

var cRaw = null;
var cResult = null;
var ctxRaw = null;
var ctxResult = null;

var currentRow = 0;
var currentCol = 0;
var aligned = 0;

window.onload = function () {
	cRaw = document.getElementById("raw");
	cResult = document.getElementById("result");
	ctxRaw = cRaw.getContext("2d");
	ctxResult = cResult.getContext("2d");

	document.getElementById('btn-create').onclick = function() {
		createCanvas();
	}

	document.getElementById('input-img').onchange = function (evt) {
    	var tgt = evt.target || window.event.srcElement; 
		var files = tgt.files;

		if (FileReader && files && files.length) {
			var fr = new FileReader();
			fr.onload = function () {
				imgRaw.src = fr.result;
			}
			fr.readAsDataURL(files[0]);
		}
	}

	cRaw.onclick = function(evt) {
		rawClicked(evt.pageX - cRaw.offsetLeft, evt.pageY - cRaw.offsetTop);
	}
}

function createCanvas() {
	var errorMsg = "";

	cols = document.getElementById("cols").value;
	rows = document.getElementById("rows").value;
	width = document.getElementById("width").value;
	height = document.getElementById("height").value;

	if (isNaN(cols)) errorMsg += " - Invalid rows number\n";
	if (isNaN(rows)) errorMsg += " - Invalid rows number\n";
	if (isNaN(width)) errorMsg += " - Invalid width number\n";
	if (isNaN(height)) errorMsg += " - Invalid height number\n";

	if (imgRaw.width == 0) errorMsg += " - Invalid image\n"
	if (imgRaw.width > cRaw.width) errorMsg += " - Image must be " + cRaw.width + "px wide maximum\n"

	if (cols * width > cResult.width) errorMsg += " - Result image must be " + cResult.width + "px wide maximum\n"

	if (errorMsg.length > 0) {
		alert("Errors : \n" + errorMsg);
	}
	else {
		var rWidth = width * cols;
		var rHeight = height * cols;

		cRaw.width = imgRaw.width;
		cRaw.height = imgRaw.height;
		ctxRaw.drawImage(imgRaw, 0, 0);

		cResult.width = cols * width;
		cResult.height = rows * height;

		document.getElementById("options").style.display="none";
		document.getElementById("ctn").style.display="block";
	}
}

function hasColor(col) {
	return col[0] != 0 || col[1] != 0 || col[2] != 0 || col[3] != 0;
}

function rawClicked(baseX, baseY) {
	var tileMinY = baseY - 1;
	var tileMaxY = baseY + 1;
	var tileMinX = baseX - 1;
	var tileMaxX = baseX + 1;

	for (var dir = 0 ; dir < 2; dir++) {
		var foundColor = true;
		
		while (foundColor) {
			foundColor = false;
			var y = 0;

			if (dir == 0) {
				tileMinY--;
				y = tileMinY;
			}

			if (dir == 1) {
				tileMaxY++;
				y = tileMaxY;
			}
			
			var i = tileMinX;

			while (i <= tileMaxX) {
				if (hasColor(ctxRaw.getImageData(i, y, 1, 1).data)) {
					foundColor = true;
				}

				if (i == tileMaxX && hasColor(ctxRaw.getImageData(i, y, 1, 1).data)) {
					tileMaxX++;
					i--;
					foundColor = true;
				}

				if (i == tileMinX && hasColor(ctxRaw.getImageData(i, y, 1, 1).data)) {
					tileMinX--;
					i -= 2;
					foundColor = true;
				}

				i++;
			}
		}
	}
	
	// Transfer tile
	var tmp = ctxRaw.getImageData(tileMinX,tileMinY,(tileMaxX - tileMinX),(tileMaxY - tileMinY));
	var rX = (currentCol * width) + (width - (tileMaxX - tileMinX))/2;
	var rY = 0;

	if (aligned == 0) rY = (currentRow * height) + (height - (tileMaxY - tileMinY));
	if (aligned == 1) rY = (currentRow * height) + (height - (tileMaxY - tileMinY))/2;
	if (aligned == 2) rY = (currentRow * height);
	ctxResult.putImageData(tmp,rX,rY);

	currentCol++;

	if (currentCol >= cols) {
		currentCol = 0;
		newLine();
	}
}

function eraseLast() {
	if (currentCol == 0) {
		if (currentRow > 0) {
			currentRow--;
			currentCol = cols - 1;

		}

	}
	else {
		currentCol--;
	}
	
	ctxResult.clearRect(currentCol * width, currentRow * height, width, height);
}

function newLine() {
	currentRow++;
	currentCol = 0;
}

function changeAlign(elem) {
	if (aligned == 0) {
		elem.innerHTML = "Aligned : center";
		aligned++;
	}
	else if (aligned == 1) {
		elem.innerHTML = "Aligned : top";
		aligned++;
	}
	else if (aligned == 2) {
		elem.innerHTML = "Aligned : bottom";
		aligned = 0;
	}
}