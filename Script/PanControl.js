function PanControl(startX, startY, updateCallback) {
	this.x = this.hardX = startX;
	this.y = this.hardY = startY;
	this.velX = 0;
	this.velY = 0;
	this.updateCallback = updateCallback;
	this.coef = 1;
}
PanControl.prototype = {
	constructor: ZoomControl,
	update: function() {
		if (typeof this.parent == "object" && typeof this.parent.canvas == "object")
			this.canvasStyle = this.parent.canvas.style;
		if (this.dragging == false) {
			if (this.velX != 0) {
				if (Math.abs(this.velX) < 0.5)
					this.velX = 0;
				this.velX *= 0.8;
				this.hardX += this.velX;
			}
			if (this.velY != 0) {
				if (Math.abs(this.velY) < 0.5)
					this.velY = 0;
				this.velY *= 0.8;
				this.hardY += this.velY;
			}
		}
		this.x = b(this.x, this.hardX, this.coef);
		this.y = b(this.y, this.hardY, this.coef);
		if (this.updateCallback instanceof Function)
			this.updateCallback(this.x, this.y);
	},
	onMouseDown: function(btnId, x, y, timestamp) {
		this.lastX = x;
		this.lastY = y;
		if (btnId == 0) {
			this.coef = 1;
			this.possibleDragging = true;
			this.offsetX = x - this.hardX;
			this.offsetY = y - this.hardY;
			this.velX = 0;
			this.velY = 0;
		}
	},
	onMouseMove: function(x, y, timestamp) {
		if (this.possibleDragging) {
			if (Math.abs((this.offsetX + this.hardX) - x) > 10 || Math.abs((this.offsetY + this.hardY) - y) > 10) {
				this.dragging = true;
				this.possibleDragging = false;
			}
		} else if (this.dragging) {
			//if (this.canvasStyle instanceof CSSStyleDeclaration)
			//	this.canvasStyle.cursor = "move";
			this.hardX = x - this.offsetX;
			this.hardY = y - this.offsetY;
			this.velX = x - this.lastX;
			this.velY = y - this.lastY;
			this.lastTimestamp = timestamp;
		} else if (this.canvasStyle instanceof CSSStyleDeclaration)
			this.canvasStyle.cursor = "default";
		this.lastX = x;
		this.lastY = y;
		return true;
	},
	onMouseUp: function(btnId, x, y, timestamp) {
		if (this.dragging) {
			if (typeof timestamp == "undefined" || Math.abs(timestamp - this.lastTimestamp) > 20 || isNaN(timestamp)) {
				this.velX = 0;
				this.velY = 0;
			}
			this.hardX = x - this.offsetX;
			this.hardY = y - this.offsetY;
			this.dragging = false;
			this.possibleDragging = false;
			//if (this.canvasStyle instanceof CSSStyleDeclaration)
			//this.canvasStyle.cursor = "default";
		} else if (this.possibleDragging) {
			this.possibleDragging = false;
		}
	},
	reset: function(x, y) {
		this.panTo(x, y);
		this.x = x;
		this.y = y;
	},
	panTo: function(x, y) {
		this.coef = 0.1;
		this.hardX = x;
		this.hardY = y;
	},
	zoomChange: function(magnify, scale) {
	}
}
