var cnvc;
function setContextDefault(ctx) {
	//console.log("Default set");
	ctx.font = '15px Fredoka One, arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
}
function canPause() {
	return false;
}

function onResume() {
	setContextDefault(cnvc.ctx);
}
function onFontLoad() {
	if (startExperiment instanceof Function) startExperiment();
	cnvc.paused = false;
}
function drawLoadingScreen(ctx) {
	ctx.font = '30px Arial';
	ctx.fillText("---- [LOADING] ----", cnvc.width / 2, cnvc.height / 2);
}
function drawPausedScreen(ctx) {
	ctx.font = '60px Fredoka One, arial';
	ctx.fillText("Paused", cnvc.width/2, cnvc.height/2-20);
	ctx.font = '15px Fredoka One, arial';
	ctx.fillText("Click to resume", cnvc.width/2, cnvc.height/2+20);
}
function drawNormalScreen(ctx) {
	if (draw instanceof Function) {
		draw(ctx, false);
	} else {
		ctx.font = '60px Fredoka One, arial';
		ctx.fillText("Error", cnvc.width/2, cnvc.height/2-20);
		ctx.font = '15px Fredoka One, arial';
		ctx.fillText("Undefined draw function", cnvc.width/2, cnvc.height/2+20);
	}
}
window.addEventListener('load', function() {
	document.body.onselectstart = () => false;
	cnvc = new CanvasUpdater('canvasRecipient',16,600,400, false);
	var local_paused = true;
	Object.defineProperty(cnvc, "paused", {
		configurable: false,
		enumerable: false,
		get: (()=>local_paused),
		set: ((value)=>{
			if (value) {
				if (canPause())
					local_paused = true;
			} else {
				local_paused = false;
				onResume();
			}
		}
		)
	});
	cnvc.paused = true;
	cnvc.checkFontLoad = (ctx)=>{
		ctx.font = '15px Fredoka One, arial';
		var width = (ctx.measureText("set_me").width);
		if (width > 56 && width < 57) {
			cnvc.checkFontLoad = (()=>true);
			onFontLoad();
			return true;
		}
		return false;
	}
	cnvc.addEventListener('update', cycles=>{
		if (!local_paused) {
			switch (cycles) {
			case 3:
				update();
			case 2:
				update();
			case 1:
				update();
			case 0, 4, 5, 6:
				break;
			default:
				cnvc.paused = true;
			}
		}
		return true;
	}
	);
	cnvc.addEventListener('draw', ctx=>{
		if (cnvc.checkFontLoad(ctx)) {
			if (cnvc.paused)
				drawPausedScreen(ctx);
			else
				drawNormalScreen(ctx);
		} else
			drawLoadingScreen(ctx);
		return true;
	}
	);
	cnvc.addObject({
		onCanvasResize: function() {
			setContextDefault(cnvc.ctx);
		},
		onMouseDown: function() {
			if (cnvc.paused)
				cnvc.paused = !cnvc.checkFontLoad(cnvc.ctx);
		}
	});
	setContextDefault(cnvc.ctx);
	cnvc.draw();
});
