const CANVAS_WIDTH  = 530;
const CANVAS_HEIGHT = 530;
var canvas;
var context;
var gameBoard;

/*----------------------------------------------------------------------------*/
/* CLASS IMAGE LOADER                                                         */
/*----------------------------------------------------------------------------*/
class ImageLoader {

	constructor () {
		this.assetsCounter = 0;
		this.assetsLoaded  = 0;
		this.idInterval    = 0;
	}

	loadImage(imageFileName) {
		var img    = new Image();
		var tmp    = this; // really???
		img.onload = function () {tmp.assetsLoaded++;};

		img.src = imageFileName;
		this.assetsCounter++;
		return img;
	}

	loadImages(imageFileNames) {
		var images = new Map();
		
		for (var i in imageFileNames) {
			images.set(imageFileNames[i], this.loadImage(imageFileNames[i]));
		}
		return images;
	}

	assetLoaded(){
		this.assetsLoaded++;
	}

	isReady () {
		if (this.assetsLoaded == this.assetsCounter) {
			return true;
		}
		return false;   
	} 

	checkReady(class2, func) {
		if(class2.isReady()) {
			clearInterval(class2.idInterval);
			func();
		}
	}

	onload(func, sleep = 10) {
		var func2       = this.checkReady;
		var class2      = this;
		this.idInterval = setInterval(function () {func2(class2,func);}, sleep);
	}
}
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/* CLASS BOARD                                                                */
/*----------------------------------------------------------------------------*/
class GameBoard {
	constructor(context, width, height) {
		this.context   = context;
		this.width     = width;
		this.height    = height;
		this.tileSize  = 60;
		this.flagDrag  = false;
		this.mouseX    = 0;
		this.mouseY    = 0;

		this.boardHistory = [];

		this.resetBoardMap();

		this.imageLoader = new ImageLoader();
	    this.imgHole     = this.imageLoader.loadImage('images/hole.png');
	    this.imgPin      = this.imageLoader.loadImage('images/pin.png');
	    this.imgReset    = this.imageLoader.loadImage('images/reset.png');
	    this.imgUndo     = this.imageLoader.loadImage('images/undo.png');

	    var tmp = this;
	    this.imageLoader.onload(function() {tmp.draw()});
	    //this.imageLoader.onload(tmp.draw); // ???
	}

	resetBoardMap() {
		this.boardMap = [ // [Y][X]
		  [0, 0, 0, 2, 2, 2, 0, 3, 4],
		  [0, 0, 0, 2, 2, 2, 0, 0, 0],
		  [0, 0, 0, 2, 2, 2, 0, 0, 0],
		  [2, 2, 2, 2, 2, 2, 2, 2, 2],
		  [2, 2, 2, 2, 1, 2, 2, 2, 2],
		  [2, 2, 2, 2, 2, 2, 2, 2, 2],
		  [0, 0, 0, 2, 2, 2, 0, 0, 0],
		  [0, 0, 0, 2, 2, 2, 0, 0, 0],
		  [0, 0, 0, 2, 2, 2, 0, 0, 0]
		];		
	}

	draw () {
	    for (var j = 0; j < 9; j++) { // a matriz é [Y][X]
	    	for (var k = 0; k < 9; k++) {
	    		switch(this.boardMap[j][k]) {
	    			case 4:
	    				this.context.drawImage(this.imgReset, k * this.tileSize, j * this.tileSize);
	    				break;
		    		case 3:
	    				this.context.drawImage(this.imgUndo, k * this.tileSize, j * this.tileSize);
		    			break;
		    		case 2:
	    				this.context.drawImage(this.imgPin, k * this.tileSize, j * this.tileSize);
		    			break;
		    		case 1:
	    				this.context.drawImage(this.imgHole, k * this.tileSize, j * this.tileSize);
	    				break;
	    		}
	    	}
	    }

	    if(this.flagDrag == true) {
	    	this.context.drawImage(this.imgPin, this.mouseX - (this.tileSize / 2), this.mouseY - (this.tileSize / 2));
	    }
	}

	redraw() {
		context.clearRect(0, 0, this.width, this.height);
    	this.draw();
	}

	mousedown(mouseX, mouseY) {
		var tileX = Math.floor(mouseX / this.tileSize);
		var tileY = Math.floor(mouseY / this.tileSize);

		switch (this.boardMap[tileY][tileX]) {
			case 2: // clicked a tile piece
				this.saveBoard();
				this.boardMap[tileY][tileX] = 1;
				this.pickX = tileX;
				this.pickY = tileY;
				this.flagDrag = true;
				this.redraw();
				break;
			case 4: // reset button
				this.resetBoardMap();			
				this.redraw();
				break;
			case 3: // undo button
				this.restoreBoard();
				break;
		}
	}

	restoreBoard() {
		if(this.boardHistory.length > 0) {
			var tmpBoard = this.boardHistory.pop();

			for (var i = 0; i < this.boardMap.length; i++) {
    			this.boardMap[i] = tmpBoard[i].slice();
			}

			this.redraw();
		}
	}

	saveBoard() {
		var tmpBoard = [];

		for (var i = 0; i < this.boardMap.length; i++)
    		tmpBoard[i] = this.boardMap[i].slice();
	    this.boardHistory.push(tmpBoard);	
	}

	mouseup(mouseX, mouseY) {
		var tileX = Math.floor(mouseX / this.tileSize);
		var tileY = Math.floor(mouseY / this.tileSize);

		if(this.flagDrag == true) {
			var flagValidMove = false;
			if(this.boardMap[tileY][tileX] == 1) { // target tile is free
				// HORIZONTAL
				if(tileY == this.pickY) { // same vertical position (the matrix is [Y][X] o.O)
					if((tileX - this.pickX) == 2) { // jumping 2 tiles to the right
						if(this.boardMap[tileY][this.pickX + 1] == 2) { // the mid tile is ocupied
							this.boardMap[tileY][this.pickX + 1] = 1; // remove the middle piece
							this.boardMap[tileY][tileX] = 2; // fill the target tile
							flagValidMove = true;
						}
					}
					if((tileX - this.pickX) == -2) { // jumping 2 tiles to the left
						if(this.boardMap[tileY][this.pickX - 1] == 2) { // the mid tile is ocupied
							this.boardMap[tileY][this.pickX - 1] = 1; // remove the middle piece
							this.boardMap[tileY][tileX] = 2; // fill the target tile
							flagValidMove = true;
						}
					}
				}
				// VERTICAL
				if(tileX == this.pickX) { // mantendo a posição horizontal
					if((tileY - this.pickY) == 2) { // pulando duas casas para baixo
						if(this.boardMap[this.pickY + 1][tileX] == 2) { // the mid tile is ocupied
							this.boardMap[this.pickY + 1][tileX] = 1; // remove the middle piece
							this.boardMap[tileY][tileX] = 2; // fill the target tile
							flagValidMove = true;
						}
					}
					if((tileY - this.pickY) == -2) { // pulando duas casas para cima
						if(this.boardMap[this.pickY - 1][tileX] == 2) { // the mid tile is ocupied
							this.boardMap[this.pickY - 1][tileX] = 1; // remove the middle piece
							this.boardMap[tileY][tileX] = 2; // fill the target tile
							flagValidMove = true;
						}
					}
				}				
			}

			if (!flagValidMove) {
				this.restoreBoard();
			}
			this.flagDrag = false;
			this.redraw();		
		}
	}

	mousemove(mouseX, mouseY) {
		this.mouseX = mouseX;
		this.mouseY = mouseY;

		if(this.flagDrag == true) {
			this.redraw();
		}
	}	

	mouseleave() {
		if(this.flagDrag == true) {			
			this.restoreBoard();
			this.flagDrag = false;
			this.redraw();
		}
	}
}
/*----------------------------------------------------------------------------*/

/**
* Creates a canvas element, loads images, adds events, and draws the canvas for the first time.
*/
function prepareCanvas()
{
	// Create the canvas (Neccessary for IE because it doesn't know what a canvas element is)
	var canvasDiv = document.getElementById('canvasDiv');
	canvas = document.createElement('canvas');
	canvas.setAttribute('width', CANVAS_WIDTH);
	canvas.setAttribute('height', CANVAS_HEIGHT);
	canvas.setAttribute('id', 'canvas');
	canvasDiv.appendChild(canvas);
	if(typeof G_vmlCanvasManager != 'undefined') {
		canvas = G_vmlCanvasManager.initElement(canvas);
	}
	context = canvas.getContext("2d"); // Grab the 2d canvas context
	// Note: The above code is a workaround for IE 8 and lower. Otherwise we could have used:
	//     context = document.getElementById('canvas').getContext("2d");
	
	gameBoard = new GameBoard(context, CANVAS_WIDTH, CANVAS_HEIGHT);

	// Add mouse events
	// ----------------
	$('#canvas').mousedown(function(e)
	{
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;

		gameBoard.mousedown(mouseX,mouseY);
  	});
	
	$('#canvas').mousemove(function(e){
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;

		gameBoard.mousemove(mouseX,mouseY);
	});

	$('#canvas').mouseup(function(e){
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;

		gameBoard.mouseup(mouseX,mouseY);
	});
	
	$('#canvas').mouseleave(function(e){
		gameBoard.mouseleave();
	});
}