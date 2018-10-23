function CellMap() {
	this.cells = [];
	this.workers = [];
}
CellMap.prototype = {
	constructor: CellMap,
	step: function() {
		//Create a copy of cells
		this.newCells = Array.from(this.cells);
		if (typeof decideAction == "function") {
			const worker = {
				read: (() => this.getValueAt(worker.x, worker.y)),
				readTop: (() => this.getValueAt(worker.x, worker.y-1)),
				readRight: (() => this.getValueAt(worker.x+1, worker.y)),
				readBottom: (() => this.getValueAt(worker.x, worker.y+1)),
				readLeft: (() => this.getValueAt(worker.x-1, worker.y)),
				killWorker: (() => this.deleteWorker(worker.x, worker.y)),
				write: (state) => (!isNaN(state))?this.setValueAt(worker.x, worker.y, state):false,
				writeTop: (state) => (!isNaN(state))?this.setValueAt(worker.x, worker.y-1, state):false,
				writeRight: (state) => (!isNaN(state))?this.setValueAt(worker.x+1, worker.y, state):false,
				writeBottom: (state) => (!isNaN(state))?this.setValueAt(worker.x, worker.y+1, state):false,
				writeLeft: (state) => (!isNaN(state))?this.setValueAt(worker.x-1, worker.y, state):false,
				move: () => ((worker.facing=="up")?worker.moveUp():(worker.facing=="right")?worker.moveRight():(worker.facing=="down")?worker.moveDown():worker.moveLeft()),
				moveUp: () => (worker.y--),
				moveRight: () => (worker.x++),
				moveDown: () => (worker.y++),
				moveLeft: () => (worker.x--),
				turnRight: () => (worker.facing = ["right", "down", "left", "up"][["up", "right", "down", "left"].indexOf(worker.facing)]),
				turnLeft: () => (worker.facing = ["left", "up", "right", "down"][["up", "right", "down", "left"].indexOf(worker.facing)])
			}
			this.workers.forEach(obj=>{
				worker.facing = ["up", "right", "down", "left"][obj.state % 4];
				worker.x = obj.x;
				worker.y = obj.y;
				worker.state = (obj.state / 4) | 0;
				decideAction(worker);
				if (worker.x !== obj.x)	obj.x = worker.x;
				if (worker.y !== obj.y) obj.y = worker.y;
				obj.state = worker.state*4+["up", "right", "down", "left"].indexOf(worker.facing);
			}
			);
		}
		this.cells = this.newCells.filter(obj=>{
			return (obj.state !== 0)
		}
		);
		this.newCells = undefined;
	},
	findAt: function(array, x, y) {
		var found = undefined;
		array.some((obj)=>{
			if (obj.x == x && obj.y == y) {
				found = obj;
				return true;
			}
			return false;
		}
		);
		return found;
	},
	getValueAt: function(x, y) {
		var found = this.findAt(this.cells, x, y);
		if (found === undefined)
			return 0;
		else
			return found.state;
	},
	setValueAt: function(x, y, state) {
		var found = this.findAt(this.newCells, x, y);
		if (found === undefined)
			this.newCells.push({
				x: x,
				y: y,
				state: state
			});
		else
			found.state = state;
	},
	drawCells(ctx, positionTranslator) {
		var cellSize = cnvc.positionTranslator.cellSize;
		this.cells.forEach(obj=>{
			if ((obj.state !== 0) && cnvc.positionTranslator.checkIfVisibleCell(obj.x, obj.y))
				this.drawCell(ctx, obj, cellSize);
		}
		)
	},
	drawWorkers(ctx, positionTranslator) {
		var cellSize = cnvc.positionTranslator.cellSize;
		ctx.fillStyle = "#4B5";
		this.workers.forEach(obj=>{
			if (cnvc.positionTranslator.checkIfVisibleCell(obj.x, obj.y))
				this.drawWorker(ctx, obj, cellSize);
		}
		)
	},
	drawCell(ctx, cell, cellSize) {
		if (cell.state == 1)
			ctx.fillStyle = "#366";
		else if (cell.state == 2)
			ctx.fillStyle = "#636";
		else if (cell.state == 3)
			ctx.fillStyle = "#633";
		ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
	},
	drawWorker(ctx, worker, cellSize) {
		ctx.fillRect(worker.x * cellSize + cellSize / 4, worker.y * cellSize + cellSize / 4, cellSize / 2, cellSize / 2);
		if (worker.state % 4 === 0)
			ctx.fillRect(worker.x * cellSize + 6 * cellSize / 16, worker.y * cellSize + cellSize / 8, cellSize / 4, cellSize / 4);
		else if (worker.state % 4 === 1)
			ctx.fillRect(worker.x * cellSize + 5 * cellSize / 8, worker.y * cellSize + 6 * cellSize / 16, cellSize / 4, cellSize / 4);
		else if (worker.state % 4 === 3)
			ctx.fillRect(worker.x * cellSize + cellSize / 8, worker.y * cellSize + 6 * cellSize / 16, cellSize / 4, cellSize / 4);
		else if (worker.state % 4 === 2)
			ctx.fillRect(worker.x * cellSize + 6 * cellSize / 16, worker.y * cellSize + 5 * cellSize / 8, cellSize / 4, cellSize / 4);
	},
	reset: function() {
		this.cells = [];
		this.workers = [];
	},
	deleteCell: function(cell) {
		var index = this.cells.indexOf(cell);
		if (index > -1) {
			this.cells.splice(index, 1);
		}
	},
	deleteWorker: function(x, y) {
		if ((!isNaN(x)) || (typeof x === "object" && !isNaN(x.x))) {
			var found = -1;
			if (isNaN(x)) {
				y = x.y;
				x = x.x;
			}
			this.workers.some((obj, i)=>{
				if (obj.x == x && obj.y == y) {
					found = i;
					return true;
				}
				return false;
			}
			);
			if (found > -1) {
				this.workers.splice(found, 1)
				return true;
			} else
				console.error("Inconsistent data");
		} else {
			console.error("Undefined parameters");
		}
		return false;
	},
	findWorker: function(x, y) {
		return this.findAt(this.workers, x, y);
	},
	findCell: function(x, y) {
		return this.findAt(this.cells, x, y);
	},
	toggleState: function(cell) {
		if (typeof cell == "object")
			cell.state = !cell.state;
	},
	addCell: function(x, y, state) {
		this.cells.push({
			x: x,
			y: y,
			state: state || 0
		});
	},
	addWorker: function(x, y, state) {
		this.workers.push({
			x: x,
			y: y,
			state: state || 0
		});
	}
}
