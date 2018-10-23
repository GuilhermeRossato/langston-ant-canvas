function ZoomControl(min, start, max) {
	this.wheelMin = min;
	this.wheelMax = max;
	var local_wheelCount, local_scale, local_scaleFollower;
	Object.defineProperty(this, "wheelCount", {
		configurable: false,
		enumerable: false,
		get: (()=>local_wheelCount),
		set: ((value)=>{
			if (typeof value == "number") {
				local_wheelCount = value | 0;
			} else {
				local_wheelCount = start;
			}
			return (local_scale = this.calculateScale(local_wheelCount));
		}
		)
	});
	Object.defineProperty(this, "scale", {
		configurable: false,
		enumerable: false,
		get: (()=>local_scaleFollower),
		set: (()=>console.warn("Set wheelCount instead"))
	});
	this.update = function() {
		if (this.parent.paused !== true) {
			if (local_scaleFollower == local_scale || Math.abs(local_scaleFollower - local_scale) < 0.001)
				local_scaleFollower = local_scale;
			else
				local_scaleFollower = b(local_scaleFollower, local_scale, 0.13);
		}
	}
	this.wheelCount = start;
	local_scaleFollower = local_scale;
}
function getBezier4(pt0, pt1, pt2, pt3, x) {
	var linear0 = b(pt0[1], pt1[1], ib(pt0[0], pt1[0], x));
	var linear1 = b(pt1[1], pt2[1], ib(pt1[0], pt2[0], x));
	var linear2 = b(pt2[1], pt3[1], ib(pt2[0], pt3[0], x));
	var quadratic0 = b(linear0, linear1, ib(pt0[0], pt2[0], x));
	var quadratic1 = b(linear1, linear2, ib(pt1[0], pt3[0], x));
	return b(quadratic0, quadratic1, ib(pt0[0], pt3[0], x));
}
ZoomControl.prototype = {
	constructor: ZoomControl,
	onWheelUp: function(deltaY) {
		if (this.wheelCount < this.wheelMax) {
			this.wheelCount++;
			if (cnvc.panControl != undefined)
				cnvc.panControl.zoomChange(true, this.scale);
		}
	},
	onWheelDown: function(deltaY) {
		if (this.wheelCount > this.wheelMin) {
			this.wheelCount--
			if (cnvc.panControl != undefined)
				cnvc.panControl.zoomChange(false, this.scale);
		}
	},
	calculateScale: function(wheelCount) {
		return getBezier4([0, 0], [0, 0], [0, 0], [this.wheelMax, 3], wheelCount)
	},
	drawScaleGraph: function(ctx, left, top, width, height) {
		ctx.fillStyle = "#333";
		ctx.fillRect(left, top, width, height);
		ctx.strokeStyle = "#BBB";
		ctx.beginPath();
		var graphPrecision = 20, currentPercentage, x, y;
		for (var i = 0; i <= graphPrecision; i++) {
			currentPercentage = ib(0, graphPrecision, i);
			x = b(left, left + width, currentPercentage);
			y = b(top + height, top, ib(0, 3, calculateScale(b(this.wheelMin, this.wheelMax, currentPercentage))));
			((i == 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
		}
		ctx.stroke();
		ctx.fillStyle = "#A44";
		ctx.beginPath();
		currentPercentage = ib(0, 3, this.scale);
		x = b(left, left + width, currentPercentage);
		y = b(top + height, top, ib(0, 3, calculateScale(b(this.wheelMin, this.wheelMax, currentPercentage))));
		ctx.arc(x, y, 5, 0, 2 * Math.PI);
		ctx.fill();
	}
}
