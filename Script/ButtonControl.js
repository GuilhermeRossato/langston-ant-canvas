// VERY specific class

function ButtonControl(width, height) {
	this.labels = ["Show Debug", "Play FAST", "Play Fast", "Play Slow", "Step", "Reset"];
	if (typeof height === "undefined")
		console.error("ButtonControl Parameters!");
	this.canvasWidth = width;
	this.canvasHeight = height;
	this.lastX = width/2;
	this.lastY = height/2;
	this.buttonWidth = 90;
	this.margin = 5;
	this.playSpeed = 0;
	cnvc.addEventListener("mouseup",(a,b,c)=>{return this.onListenedMouseUp.call(this,a,b,c)});
}

ButtonControl.prototype = {
	constructor: ButtonControl,
	buttonPress: function(text) {
		if (text == "Show Debug") {
			this.showDebug = true;
			this.labels[0] = "Hide Debug";
		} else if (text == "Hide Debug") {
			this.showDebug = false;
			this.labels[0] = "Show Debug";
		} else if (text == "Play FAST") {
			this.playSpeed = 3;
			this.labels[1] = "Stop";
			this.labels[2] = "Play Fast";
			this.labels[3] = "Play Slow";
		} else if (text == "Play Fast") {
			this.playSpeed = 2;
			this.labels[1] = "Play FAST";
			this.labels[2] = "Stop";
			this.labels[3] = "Play Slow";
		} else if (text == "Play Slow") {
			this.playSpeed = 1;
			this.labels[1] = "Play FAST";
			this.labels[2] = "Play Fast";
			this.labels[3] = "Stop";
		} else if (text == "Stop") {
			this.playSpeed = 0;
			this.labels[1] = "Play FAST";
			this.labels[2] = "Play Fast";
			this.labels[3] = "Play Slow";
		} else if (text == "Step")
			cnvc.cellMap.step();
		else if (text == "Reset") {
			this.buttonPress("Stop");
			cnvc.cellMap.reset();
			cnvc.panControl.panTo(cnvc.width / 2, cnvc.height / 2);
		}
	},
	getBoundingBox: function(btnId) {
		return {
			top: this.canvasHeight - 30,
			right: this.canvasWidth/2-(this.labels.length*(this.buttonWidth+this.margin)/2)+btnId*(this.buttonWidth+this.margin)+this.buttonWidth+this.margin/2,
			bottom: this.canvasHeight - 10,
			left: this.canvasWidth/2-(this.labels.length*(this.buttonWidth+this.margin)/2)+btnId*(this.buttonWidth+this.margin)+this.margin/2
		}
	},
	whichButtonIsPointOver: function (x, y) {
		// And the award for best function name goes to...
		var self = this, id = -1;
		if (typeof x !== "number")
			return -1;
		this.labels.some((label, i) => {
			var box = self.getBoundingBox(i);
			if (x > box.left && x < box.right && y > box.top && y < box.bottom) {
				id = i;
				return true;
			}
			return false;
		});
		return id;
	},
	draw: function (ctx) {
		var id = this.whichButtonIsPointOver(this.lastX, this.lastY), self = this;
		ctx.strokeStyle = "#666";
		ctx.textAlign = "center";
		this.labels.forEach((label,i)=>{
			var box = self.getBoundingBox(i);
			if (id == i)
				ctx.fillStyle = this.isDown ? "#BBB" : "#888";
			else
				ctx.fillStyle = "#AAA";
			ctx.fillRect(box.left, box.top, box.right-box.left, box.bottom-box.top);
			ctx.fillStyle = "#333";
			ctx.fillText(label, (box.left+box.right)/2, (box.top+box.bottom)/2);
		})
		if (this.showDebug)
			this.showDebugInfo(ctx);
		return true;
	},
	showDebugInfo: function (ctx) {
		ctx.textAlign = "left";
		ctx.fillStyle = "#333";
		ctx.fillText("panX ", 5, 10);
		ctx.fillText("panY ", 5, 10 + 15);
		ctx.fillText("scale", 5, 10 + 15 * 2);
		ctx.fillText("mx", 5, 10 + 15 * 3);
		ctx.fillText("my", 5, 10 + 15 * 4);
		ctx.fillText("mx", 5, 10 + 15 * 3);
		ctx.fillText("my", 5, 10 + 15 * 4);
		ctx.fillText(this.numberToSpecificFormat(cnvc.panControl.x, 6), 45, 10);
		ctx.fillText(this.numberToSpecificFormat(cnvc.panControl.y, 6), 45, 10 + 15);
		ctx.fillText(this.numberToSpecificFormat(cnvc.zoomControl.scale, 6), 45, 10 + 15 * 2);
		ctx.fillText(this.numberToSpecificFormat(cnvc.panControl.lastX, 6), 45, 10 + 15 * 3);
		ctx.fillText(this.numberToSpecificFormat(cnvc.panControl.lastY, 6), 45, 10 + 15 * 4);
	},
	numberToSpecificFormat: function (number, size, char) {
		if (typeof number !== "number")
			return "NaN";
		var str = number.toString();
		if (str.length >= size) {
			if (str[size - 1] == '.')
				return str.substring(0, size - 1);
			else
				return str.substring(0, size);
		} else {
			if (size - str.length > 1) {
				return str = str + '.' + (new Array(size - str.length).join(char || '0'));
			} else {
				if (str[0] == '-')
					return str = '-' + (new Array(size - str.length + 1).join(char || '0')) + str.substring(1);
				else
					return str = (new Array(size - str.length + 1).join(char || '0')) + str;
			}
		}
	},
	onMouseDown: function(btnId) {
		if (btnId == 0) {
			this.isDown = true;
			var id = this.whichButtonIsPointOver(this.lastX, this.lastY);
			this.theButtonPressed = id;
			if (id != -1) {
				if (typeof cnvc.panControl == "object") {
					if (cnvc.panControl.dragging)
						cnvc.panControl.onMouseUp(btnId, x, y);
					else if (cnvc.panControl.possibleDragging)
						cnvc.panControl.possibleDragging = false;
				} else 
					console.warn("cnvc.panControl?");
			}
		}
	},
	onMouseMove: function(x, y) {
		this.lastX = x;
		this.lastY = y;
	},
	onListenedMouseUp: function(btnId, x, y) {
		this.isDown = false;
		if (btnId == 0) {
			this.isDown = true;
			var id = this.whichButtonIsPointOver(this.lastX, this.lastY);
			if (id != -1 && this.theButtonPressed == id) {
				this.buttonPress(this.labels[id]);
				if (typeof cnvc.panControl == "object") {
					if (cnvc.panControl.dragging)
						cnvc.panControl.onMouseUp(btnId, x, y);
					else if (cnvc.panControl.possibleDragging)
						cnvc.panControl.possibleDragging = false;
					return false;
				} else 
					console.warn("cnvc.panControl?");

			}
		}
		return true;
	}
}