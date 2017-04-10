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
var blackListed = null;

window.onload = function () {
	cRaw = document.getElementById("raw");
	cResult = document.getElementById("result");
	ctxRaw = cRaw.getContext("2d");
	ctxResult = cResult.getContext("2d");

	document.getElementById('btn-create').onclick = function() {
		this.innerHTML = "Please wait...";

		setTimeout(function () {
			createCanvas();
		}, 100)		
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

	cRaw.onmousemove = function(evt) {
		var color = ctxRaw.getImageData(evt.pageX - cRaw.offsetLeft, evt.pageY - cRaw.offsetTop, 1, 1).data;
		document.getElementById("cursor-info").innerHTML = "Color : " + color[0] + ", " + color[1] + "," + color[2] + "";
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

	if (errorMsg.length > 0) {
		alert("Errors : \n" + errorMsg);
		document.getElementById('btn-create').innerHTML = "Create";
	}
	else {
		var rWidth = width * cols;
		var rHeight = height * cols;

		cRaw.width = imgRaw.width;
		cRaw.height = imgRaw.height;
		ctxRaw.drawImage(imgRaw, 0, 0);

		cResult.width = cols * width;
		cResult.height = rows * height;	

		var colors = new Array();

		for (var x = 0; x < imgRaw.width; x++) {
			for (var y = 0; y < imgRaw.height; y++) {
				var color = ctxRaw.getImageData(x, y, 1, 1).data;
				var key = color[0] + "-" + color[1] + "-" + color[2];

				if (color[3] > 0) {
					if (colors[key] == null) {
						colors[key] = 0;
					}

					colors[key]++;
				}
			}
		}

		var colMax = null;

		for (var i in colors) {
			if (colMax == null) colMax = i;
			
			if (colors[i] > colors[colMax]) {
				colMax = i;
			}
		}

		if (colors[colMax] > imgRaw.width * imgRaw.height * 0.4) {
			if (confirm("It seems like there is a background color. Remove that color from the resulting spritesheet?")) {
				blackListed = colMax.split("-");
			}
		}

		document.getElementById("ctn").style.width = cRaw.width + cResult.width + 20 + "px";
		
		document.getElementById("options").style.display="none";
		document.getElementById("ctn").style.display="block";
	}
}

function hasColor(col) {
	return (col[0] != 0 || col[1] != 0 || col[2] != 0 || col[3] != 0) &&
		   (blackListed == null || (blackListed[0] != col[0] || blackListed[1] != col[1] || blackListed[2] != col[2]));
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

				if (tileMaxY - tileMinY > height || tileMaxX - tileMinX > width) {
					foundColor = false;
					dir = 3;
					break;
				}

				i++;
			}
		}
	}
	
	// Transfer tile
	for (var x = tileMinX; x <= tileMaxX; x++) {
		for (var y = tileMinY; y <= tileMaxY; y++) {
			var tmp = ctxRaw.getImageData(x,y, 1, 1).data;
			var rX = (currentCol * width) + (width - (tileMaxX - tileMinX))/2 + (x - tileMinX);
			var rY = 0;

			if (aligned == 0) rY = (currentRow * height) + (height - (tileMaxY - tileMinY));
			if (aligned == 1) rY = (currentRow * height) + (height - (tileMaxY - tileMinY))/2;
			if (aligned == 2) rY = (currentRow * height) ;

			if (hasColor(tmp)) {
				ctxResult.putImageData(ctxRaw.getImageData(x,y, 1, 1), rX, rY + (y - tileMinY));
			}
		}
	}

	

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