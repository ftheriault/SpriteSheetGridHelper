var cols = 0;
var rows = 1;
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

	document.getElementById('input-new-img').onchange = function (evt) {
    	var tgt = evt.target || window.event.srcElement;
		var files = tgt.files;

		if (FileReader && files && files.length) {

			var fr = new FileReader();
			fr.onload = function () {
				imgRaw.onload = () => {
					document.getElementById('new-img-section').style.display = "none";
					document.getElementById("ctn").style.display="none";
					setTimeout(() => {
						createCanvas(false);
					}, 100)
				}
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

function createCanvas(resetResult = true) {
	var errorMsg = "";

	cols = document.getElementById("cols").value;
	width = document.getElementById("width").value;
	height = document.getElementById("height").value;

	if (isNaN(cols)) errorMsg += " - Invalid rows number\n";
	if (isNaN(width)) errorMsg += " - Invalid width number\n";
	if (isNaN(height)) errorMsg += " - Invalid height number\n";

	if (imgRaw.width == 0) errorMsg += " - Invalid image\n"

	if (errorMsg.length > 0) {
		alert("Errors : \n" + errorMsg);
		document.getElementById('btn-create').innerHTML = "Create";
	}
	else {
		document.getElementById("mCol").value = "0";
		document.getElementById("mRow").value = "0";

		var rWidth = width * cols;
		var rHeight = height * cols;

		cRaw.width = imgRaw.width;
		cRaw.height = imgRaw.height;
		ctxRaw.drawImage(imgRaw, 0, 0);

		if (resetResult) {
			cResult.width = cols * width;
			cResult.height = rows * height;
		}

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

function getTile(ctxSrc,baseX, baseY, scanForColor) {
	if (scanForColor) {
		var stop = false;

		for (var i = baseX; i < baseX + width; i+=4) {
			for (var j = baseY; j < baseY + height; j+=4) {
				if (hasColor(ctxSrc.getImageData(i, j, 1, 1).data)) {
					baseX = i;
					baseY = j;
					stop = true;
					break;
				}
			}

			if (stop) {
				break;
			}
		}
	}

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
				if (hasColor(ctxSrc.getImageData(i, y, 1, 1).data)) {
					foundColor = true;
				}

				if (i == tileMaxX && hasColor(ctxSrc.getImageData(i, y, 1, 1).data)) {
					tileMaxX++;
					i--;
					foundColor = true;
				}

				if (i == tileMinX && hasColor(ctxSrc.getImageData(i, y, 1, 1).data)) {
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

	return [tileMinX, tileMaxX, tileMinY, tileMaxY];
}

function setTile(ctxSrc, ctxDest, tileMinX, tileMaxX, tileMinY, tileMaxY) {
	// Transfer tile
	for (var x = tileMinX; x <= tileMaxX; x++) {
		for (var y = tileMinY; y <= tileMaxY; y++) {
			var tmp = ctxSrc.getImageData(x,y, 1, 1).data;
			var rX = (currentCol * width) + (width - (tileMaxX - tileMinX))/2 + (x - tileMinX);
			var rY = 0;

			if (aligned == 0) rY = (currentRow * height) + (height - (tileMaxY - tileMinY));
			if (aligned == 1) rY = (currentRow * height) + (height - (tileMaxY - tileMinY))/2;
			if (aligned == 2) rY = (currentRow * height) ;

			if (hasColor(tmp)) {
				ctxResult.putImageData(ctxSrc.getImageData(x,y, 1, 1), rX, rY + (y - tileMinY));
			}
		}
	}
}

function rawClicked(baseX, baseY) {
	if (currentCol >= cols) {
		currentCol = 0;
		newLine();
	}

	var data = getTile(ctxRaw, baseX, baseY, false);
	setTile(ctxRaw, ctxResult, data[0], data[1], data[2], data[3]);

	document.getElementById("mCol").value = currentCol;
	document.getElementById("mRow").value = currentRow;

	currentCol++;
}

function getLastCell() {
	var c = currentCol;
	var r = currentRow;

	if (c == 0) {
		if (r > 0) {
			r--;
			c = cols - 1;
		}

	}
	else {
		c--;
	}

	return [c, r];
}

function eraseLast() {
	var data = getLastCell();
	currentCol = data[0];
	currentRow = data[1];

	ctxResult.clearRect(currentCol * width, currentRow * height, width, height);

	if (currentCol == 0 && currentRow > 0) {
		var img = ctxResult.getImageData(0, 0, width * cols, height * rows);
		rows--;
		cResult.height = rows * height;
		ctxResult.putImageData(img, 0, 0);
	}

	document.getElementById("mCol").value = currentCol;
	document.getElementById("mRow").value = currentRow;
}

function newLine() {
	currentRow++;

	if (currentRow >= rows) {
		var img = ctxResult.getImageData(0, 0, width * cols, height * rows);
		rows++;
		cResult.height = rows * height;
		ctxResult.putImageData(img, 0, 0);
	}

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

function moveTile(x, y) {
	var tileCol = parseInt(document.getElementById("mCol").value);
	var tileRow = parseInt(document.getElementById("mRow").value);

	if (!isNaN(tileCol) && !isNaN(tileRow) && tileCol >= 0 && tileRow >= 0 && tileCol < cols && tileRow < rows) {
		var data = getTile(ctxResult, tileCol * width, tileRow * height, true);

		if (data[0] + x >= parseInt((tileCol) * width) && data[1] + x <= parseInt((tileCol + 1) * width) &&
			data[2] + y >= parseInt((tileRow) * height) && data[3] + y <= parseInt((tileRow + 1) * height)) {

			var img = ctxResult.getImageData(tileCol * width, tileRow * height, width, height);
			ctxResult.clearRect(tileCol * width, tileRow * height, width, height);
			ctxResult.putImageData(img, tileCol * width + x, tileRow * height + y);
		}
	}
}