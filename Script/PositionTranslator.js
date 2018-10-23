function PositionTranslator(cellSize) {
	this.mouseX = 0;
	this.mouseY = 0;
	this.panX = 0;
	this.panY = 0;
	this.cellSize = cellSize;
	this.scale = 1;
	this.lastCellX = 0;
	this.lastCellY = 0;
}
PositionTranslator.prototype = {
	constructor: PositionTranslator,
	getCellCoordsFromMouse: function(x, y) {
		if (typeof x == "number")
			this.mouseX = x;
		if (typeof y == "number")
			this.mouseY = y;
		var ret = {
			x: Math.floor((this.mouseX - this.panX) / (this.cellSize * this.scale)),
			y: Math.floor((this.mouseY - this.panY) / (this.cellSize * this.scale))
		};
		this.lastCellX = ret.x;
		this.lastCellY = ret.y;
		return ret;
	},
	updatePanning: function(x, y) {
		this.panX = x;
		this.panY = y;	
	},
	getVisualCellSize: function() {
		return this.cellSize * this.scale;
	},
	getCellBoundingBox: function(cellPosition) {
		var cell = this.getVisualCellSize();
		return {
			left: this.panX + cellPosition.x * cell,
			right: this.panX + cellPosition.x * cell + cell,
			top: this.panY + cellPosition.y * cell,
			bottom: this.panY + cellPosition.y * cell + cell
		}
	},
	checkIfVisibleCell: function(x, y) {
		return true;
	}
}
