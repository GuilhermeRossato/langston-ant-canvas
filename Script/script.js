'use strict';

document.onwheel = () => false;
document.onselectionstart = () => false;

function decideAction(worker) {
	var cell = worker.read();
	if (cell == 0) {
		worker.write(1);
		worker.turnRight();
		worker.move();
	} else {
		worker.write(0);
		worker.turnLeft();
		worker.move();
	}
}

var lastTimestamp = 0;
var step = 0;

function startExperiment() {
	cnvc.zoomControl = new ZoomControl(12,35,40);
	cnvc.positionTranslator = new PositionTranslator(20);
	cnvc.panControl = new PanControl(cnvc.width / 2,cnvc.height / 2);
	cnvc.cellMap = new CellMap();
	cnvc.buttonControl = new ButtonControl(cnvc.width ,cnvc.height);
	cnvc.addObject(cnvc.zoomControl);
	cnvc.addObject(cnvc.cellMap);
	cnvc.addObject(cnvc.positionTranslator);
	cnvc.addObject(cnvc.panControl);
	cnvc.addObject(cnvc.buttonControl);
	cnvc.addEventListener("mousedown", onMouseDown)
	cnvc.addEventListener("mouseup", onMouseUp)
}
function update() {
	//cnvc.panControl.hardX += 0.25;
	//cnvc.panControl.hardY -= 0.25;
	if (cnvc.buttonControl.playSpeed > 0) {
		let startAt = (cnvc.buttonControl.playSpeed===1?85:(cnvc.buttonControl.playSpeed===2?96:100));
		if (step >= 100) {
			cnvc.cellMap.step();
			step = startAt;
		} else if (step < startAt)
			step = startAt;
		else
			step++;
	}
}

function onMouseDown(btnId, x, y, timestamp) {
	lastTimestamp = timestamp;
	return true;
}

function onMouseUp(btnId, x, y, timestamp) {
	if (!cnvc.panControl.dragging && Math.abs(timestamp - lastTimestamp < 350)) {
		var mouseCell = cnvc.positionTranslator.getCellCoordsFromMouse(x, y);
		if (btnId == 0) {
			var cell = cnvc.cellMap.findCell(mouseCell.x, mouseCell.y);
			if (cell == undefined)
				cnvc.cellMap.addCell(mouseCell.x, mouseCell.y, 1);
			else {
				if (cell.state < 1)
					cell.state++;
				else
					cnvc.cellMap.deleteCell(cell);
			}
		} else if (btnId == 2) {
			var worker = cnvc.cellMap.findWorker(mouseCell.x, mouseCell.y);
			if (worker == undefined)
				cnvc.cellMap.addWorker(mouseCell.x, mouseCell.y, 0);
			else {
				if (worker.state < 3)
					worker.state++;
				else
					cnvc.cellMap.deleteWorker(worker);
			}
		}
	}
	return true;
}

function draw(ctx) {
	cnvc.isThisFrameDrawn = true;
	ctx.textAlign = "center";
	ctx.save();
	ctx.translate(cnvc.panControl.x, cnvc.panControl.y);
	cnvc.positionTranslator.updatePanning(cnvc.panControl.x, cnvc.panControl.y)
	ctx.scale(cnvc.zoomControl.scale, cnvc.zoomControl.scale);
	cnvc.positionTranslator.scale = cnvc.zoomControl.scale;
	ctx.fillStyle = "#477";
	ctx.fillText("origin", 0, 0);
	cnvc.cellMap.drawCells(ctx, cnvc.positionTranslator);
	cnvc.cellMap.drawWorkers(ctx, cnvc.positionTranslator);
	ctx.restore();
	highlightSelection(ctx, cnvc.panControl.lastX, cnvc.panControl.lastY);
	if (cnvc.zoomControl.scale > 0.15)
		drawGrid(ctx);
	else {
		ctx.fillStyle = "rgba(0,0,0,0.1)";
		ctx.fillRect(0, 0, cnvc.width, cnvc.height);
	}
	return true;
}
function highlightSelection(ctx, x, y) {
	var mouseCell = cnvc.positionTranslator.getCellCoordsFromMouse(x, y);
	var box = cnvc.positionTranslator.getCellBoundingBox(mouseCell);
	var fifth = cnvc.positionTranslator.getVisualCellSize() / 5;
	ctx.lineWidth = 1;
	ctx.save();
	ctx.strokeStyle = "#F00";
	ctx.translate(0.5, 0.5)
	ctx.beginPath();
	ctx.moveTo(box.left + fifth | 0, box.top + 1 | 0);
	ctx.lineTo(box.left + 1 | 0, box.top + 1 | 0);
	ctx.lineTo(box.left + 1 | 0, box.top + fifth | 0);
	ctx.moveTo(box.left + fifth | 0, box.bottom - 1 | 0);
	ctx.lineTo(box.left + 1 | 0, box.bottom - 1 | 0);
	ctx.lineTo(box.left + 1 | 0, box.bottom - fifth | 0);
	ctx.moveTo(box.right - fifth | 0, box.top + 1 | 0);
	ctx.lineTo(box.right - 1 | 0 | 0, box.top + 1 | 0);
	ctx.lineTo(box.right - 1 | 0, box.top + fifth | 0);
	ctx.moveTo(box.right - fifth | 0, box.bottom - 1 | 0);
	ctx.lineTo(box.right - 1 | 0, box.bottom - 1 | 0);
	ctx.lineTo(box.right - 1 | 0, box.bottom - fifth | 0);
	ctx.stroke();
	ctx.restore();
}

function drawGrid(ctx) {
	var cell = cnvc.positionTranslator.getVisualCellSize();
	var panX = cnvc.positionTranslator.panX;
	var panY = cnvc.positionTranslator.panY;
	ctx.save();
	ctx.lineWidth = b(0.05, 1, ib(0, 3, cnvc.positionTranslator.scale));
	ctx.strokeSyle = "#333"
	ctx.beginPath();
	for (var y = panY % cell; y < cnvc.height; y += cell) {
		if (Math.abs(y - panY) > cell / 2) {
			ctx.moveTo(0, (y | 0) + 0.5);
			ctx.lineTo(cnvc.width, (y | 0) + 0.5);
		}
	}
	for (var x = panX % cell; x < cnvc.width; x += cell) {
		if (Math.abs(x - panX) > cell / 2) {
			ctx.moveTo((x | 0) + 0.5, 0);
			ctx.lineTo((x | 0) + 0.5, cnvc.height);
		}
	}
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, (panY | 0) + 0.5);
	ctx.lineTo(cnvc.width, (panY | 0) + 0.5);
	ctx.moveTo((panX | 0) + 0.5, 0);
	ctx.lineTo((panX | 0) + 0.5, cnvc.height);
	ctx.stroke();
	ctx.restore();
}
