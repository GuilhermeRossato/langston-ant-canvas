/*	CanvasUpdater.js - Created by GuilhermeRossato 10/2016
 *
 * This class should be created in any of the cases:
 *	1. You have a <div> element that you wish to put a canvas into
 *	2. You have a <canvas> element that you want to take control over
 *
 * This class helps with the following operations:
 *	1. Every mouse and keyboard operations related to the <canvas> element
 *	2. Working with multiple virtual objects that should be iterated (drawn, updated and cleared) in the canvas
 *	3. Changing cursor depending where the mouse is in the canvas
 * 
 * Create the object when then the recipient you want the canvas in is loaded:
 *  = new CanvasUpdater(document.getElementById("recipient"));
 * --------------------------------------------------------------------------------------------------------
 * Methods:
 *	constructor(recipient, delay[, width, height, ctxMenu])	---> Class Constructor ( new CanvasUpdater(...) )
 *		recipient	(HTMLDivElement)	The <div> element for a new canvas to be put at
 * 		delay		(number)			Miliseconds between update callbacks (16.6 => 60fps)
 * 		width		(number)			Size of the canvas element in pixels (default 960 px)
 * 		height		(number)			Size of the canvas element in pixels (default 480 px)
 *		ctxMenu		(Boolean)			Whenever rightclicking should open context menu or not (default true)
 *
 *	constructor(canvas, delay[, width, height, ctxMenu])	---> Class Constructor ( new CanvasUpdater(...) )
 *		canvas		(HTMLCanvasElement)	The <canvas> element you want to be associated and handled by this class
 *
 *	constructor(str, delay[, width, height, ctxMenu])	---> Class Constructor ( new CanvasUpdater(...) )
 *		str			(string)			A string with the ID of the <canvas> (to associate) or the <div> element (to create a canvas into)
 * 
 *	addObject(object) ---> Adds one object to the list of objects inside this class
 *		object							An instance of the object to be put inside
 * 
 *			The following functions are propagated to all objects added into it
 * 				 draw(ctx), update(), onMouseMove(x, y), onMouseDown(button, x, y), onMouseUp(button, x, y), onKeyDown(keyId, ctrlKey, shiftKey, altKey), onKeyUp(keyId, ctrlKey, shiftKey, altKey)
 *			(only if these specific functions are defined, no error will occur if left undefined)
 *			It also gives each object the property .parent (pointing to this class)
 *
 *  .removeObject(object) ---> Removes one object from the list of objects
 *
 * 	.addEventListener(type, listener)	---> Add a hook to be run before a specific function call
 * 		type		(string)			Candidates: "draw", "update", "mousemove", "mousedown", "mouseup", "mouseclick", "keydown", "keyup", "resize", "scrollup", "scrolldown".
 * 		listener	(function)			function to call when the specific event happens
 *
 *			The process of hooking an event allow you to block events that a portion of your software already processed
 *			By returning falsy, you tell this class that you handled the event fully and it should be ignored.
 *
 *	.removeEventListener(type, listener);		Removes a very specific listener function from a specific event type
 *
 *	.clearEventListener(type)					Clears absolutely all listener of a specific event type
 *
 * --------------------------------------------------------------------------------------------------------
 * Usable Properties:
 *	.canvas;		(Object) Instance of HTMLCanvasElement (HTML5)
 *	.ctx;			(Object) Instance of CanvasRenderingContext2D
 * 	.mouse  {...}	(Object) Object that holds some information about the mouse state
 * 		.x			(Number) Mouse's horizontal position in pixels relative to the canvas, '0' is left, 'canvas width' is right
 * 		.y			(Number) Mouse's vertical position in pixels relative to the canvas, '0' is top, 'canvas height' is bottom
 * 		.left		Boolean, whenever the left mouse button is being pressed down
 * 		.middle		Boolean, whenever the middle mouse button is being pressed down
 * 		.right		Boolean, whenever the right mouse button is being pressed down
 * --------------------------------------------------------------------------------------------------------
 * "Private" Properties:
 *		.events;		Array with keys corresponding to event types (string) to use with event listeners.
 *		.objects;		Array with objects to handle, send draw calls, etc
 *
 * Each object added to this class can optionally contain the following methods/functions:
 *	draw(ctx), onMouseMove(x, y), onMouseDown(x, y, buttonId), onMouseUp(x, y, buttonId), onKeyDown(keyCode, ctrlDown, shiftDown, ev.altDown), onScrollDown(deltaY), onScrollUp(deltaY), onCanvasResize(property, oldValue, newValue)
 * And the following properties:
 *	alive [bool], cursor [string], box [GuiBox]
 */
const FULL_CLEAR_ON_DRAW = true;
function CanvasUpdater(arg1, delay, width, height, ctxMenu) {
	const self = this;
	let canvas = undefined;
	function createCanvas(object) {
		assignCanvas(document.createElement('canvas'));
		object.appendChild(self.canvas);
	}
	function assignCanvas(object) {
		Object.defineProperty(self, "canvas", {
			configurable: false,
			enumerable: false,
			value: object,
			writable: false
		});
		assignCanvas = (()=>{
			throw "Reassign: Canvas has already been defined.";
		}
		);
	}
	if (typeof arg1 === "string") {
		let object = document.getElementById(arg1);
		if (object instanceof HTMLDivElement) {
			createCanvas(object);
		} else if (object instanceof HTMLCanvasElement) {
			assignCanvas(object);
		} else {
			throw "Search Fail: Specified object could not be found by id";
			// It may be necessary to create this class only after the document fully loads, supposedly using document.addEventListener with the event "load"
		}
	} else if (arg1 instanceof HTMLDivElement)
		createCanvas(arg1);
	else if (arg1 instanceof HTMLCanvasElement)
		assignCanvas(arg1);
	else
		throw "Argument Error: First argument is invalid";
	if ((typeof delay !== "number") || (isNaN(delay)))
		throw "Argument Error: Delay argument is invalid";
	let local = {};
	["width", "height"].forEach((property,i)=>{
		let parameter = (i === 0 ? width : height);
		local[property] = ((typeof parameter === "number") && (!isNaN(parameter))) ? parameter : (i === 0 ? 480 : 360);
		self.canvas[property] = local[property];
		Object.defineProperty(self, property, {
			configurable: false,
			enumerable: false,
			get: (()=>local[property]),
			set: ((value)=>{
				if (typeof value != "number" || isNaN(value) || value <= 0)
					console.warn("Warning: Ignored invalid input for canvas " + property + ".");
				else if (self.beforeResize(property, local[property], value)) {
					local[property] = self.canvas[property] = value;
					self.afterResize();
				}
			}
			)
		});
	}
	);
	if (ctxMenu === false) {
		self.canvas.oncontextmenu = function() {
			return false;
		}
	}
	Object.defineProperty(self, "ctx", {
		configurable: false,
		enumerable: false,
		value: self.canvas.getContext("2d"),
		writable: false
	});
	self.events = [];
	self.objects = [];
	self.mouse = {
		x: local["width"] / 2,
		y: local["height"] / 2,
		left: false,
		middle: false,
		right: false
	};
	local["cursor"] = "default";
	Object.defineProperty(self.mouse, "cursor", {
		configurable: false,
		enumerable: false,
		get: (()=>local["cursor"]),
		set: ((value)=>{
			if (typeof value != "string")
				console.warn("Warning: Ignored invalid input for mouse cursor.");
			else if ((value = value.toLowerCase()) != local["cursor"])
				self.canvas.style.cursor = (local["cursor"] = self.mouse.cursor["cursor"] = value).toString();
		}
		)
	});
	if (document instanceof Document) {
		// Assign document events to this class
		document.addEventListener("mousedown", ev=>CanvasUpdater.prototype.onMouseDown.call(self, ev), false);
		document.addEventListener("mouseup", ev=>CanvasUpdater.prototype.onMouseUp.call(self, ev), false);
		document.addEventListener("mousemove", ev=>CanvasUpdater.prototype.onMouseMove.call(self, ev), false);
		document.onkeydown = (ev=>CanvasUpdater.prototype.onKeyDown.call(self, ev));
		//document.onkeyup = (ev=>CanvasUpdater.prototype.onKeyUp.call(self, ev));
		document.addEventListener("keyup", ev=>CanvasUpdater.prototype.onKeyUp.call(self, ev), false);
		document.addEventListener('wheel', (ev)=> ((ev.deltaY < 0) ? self.onWheelUp : self.onWheelDown).call(this, ev.deltaY), {passive: true});
	} else {
		console.warn("Warning: No events were attributed to this class");
	}
	// Prevent function callback loop
	if (typeof (Timestamper) !== 'undefined') {
		this.timestamper = new Timestamper(delay,function(cycles) {
			self.update(cycles);
		}
		);
	}
	this.inProcess = false;
	this.isThisFrameDrawn = false;
	//this.draw();
}
CanvasUpdater.prototype = {
	constructor: CanvasUpdater,
	eventCandidates: ["draw", "update", "mousemove", "mousedown", "mouseup", "mouseclick", "keydown", "keyup", "resize", "wheelup", "wheeldown"],
	update: function(cycles) {
		this.isThisFrameDrawn = false;
		var self = this;
		if ((!(self.events["update"]instanceof Array)) || (self.events["update"].every(obj=>obj.call(self, cycles)))) {
			self.objects.forEach(obj=>{
				if (obj instanceof Object && obj.update instanceof Function && obj.alive !== false)
					obj.update.call(obj, cycles);
			}
			);
			self.draw();
		}
	},
	draw: function() {
		if (this.isThisFrameDrawn)
			return false;
		if (this.inProcess) {
			console.warn("Warning: callback loop prevented");
			return false;
		}
		this.inProcess = true;
		var ctx = this.ctx;
		//ctx.fillStyle = "rgba(255,255,255,0.5)";
		if (FULL_CLEAR_ON_DRAW)
			//ctx.fillRect(-1, -1, this.width + 2, this.height + 2);
			ctx.clearRect(-1, -1, this.width + 2, this.height + 2);
		if ((!(this.events["draw"]instanceof Array)) || (this.events["draw"].every(obj=>obj.call(this, ctx)))) {
			// Since all 'draw' hooks have returned true, the drawing will occur:
			this.objects.forEach(function(obj) {
				if (obj instanceof Object) {
					if ((!FULL_CLEAR_ON_DRAW) && obj.clear instanceof Function)
						obj.clear.call(obj, ctx);
					if (obj.draw instanceof Function)
						obj.draw.call(obj, ctx);
				}
			});
		}
		this.inProcess = false;
	},
	beforeResize: function(property, lastValue, newValue) {
		if (this.inProcess) {
			console.warn("Warning: callback loop prevented");
			return false;
		}
		this.inProcess = true;
		if ((!(this.events["resize"]instanceof Array)) || (this.events["resize"].every(obj=>obj.call(this, property, lastValue, newValue)))) {
			this.inProcess = false;
			return true;
		} else {
			this.inProcess = false;
			return false;
		}
	},
	afterResize: function() {
		this.objects.forEach(obj=>{
			if (obj instanceof Object && obj.onCanvasResize instanceof Function && obj.alive !== false)
				obj.onCanvasResize.call(obj)
		}
		);
	},
	onMouseDown: function(ev) {
		if (this.inProcess) {
			console.warn("Warning: callback loop prevented");
			return false;
		}
		this.inProcess = true;
		let self = this
		  , redraw = false
		  , m = this.getMousePosition(ev)
		  , btnCode = ev.button;
		if ((!(this.events["mousedown"]instanceof Array)) || (this.events["mousedown"].every(obj=>obj.call(this, btnCode, m.x, m.y, ev.timeStamp)))) {
			switch (btnCode) {
			case 0:
				this.mouse.left = true;
				break;
			case 1:
				this.mouse.middle = true;
				break;
			case 2:
				this.mouse.right = true;
				break;
			default:
				break;
			}
			this.objects.forEach(obj=>{
				if (obj instanceof Object && obj.onMouseDown instanceof Function && obj.alive !== false)
					if (obj.onMouseDown.call(obj, btnCode, m.x, m.y, ev.timeStamp))
						redraw = true;
			}
			);
		}
		this.inProcess = false;
		if (redraw)
			self.draw();
	},
	onMouseUp: function(ev) {
		if (this.inProcess) {
			console.warn("Warning: callback loop prevented");
			return false;
		}
		this.inProcess = true;
		let self = this
		  , redraw = false
		  , m = this.getMousePosition(ev)
		  , btnCode = ev.button;
		if ((!(this.events["mouseup"]instanceof Array)) || (this.events["mouseup"].every(func=>func.call(self, btnCode, m.x, m.y, ev.timeStamp)))) {
			switch (btnCode) {
			case 0:
				this.mouse.left = false;
				break;
			case 1:
				this.mouse.middle = false;
				break;
			case 2:
				this.mouse.right = false;
				break;
			default:
				break;
			}
			this.objects.forEach(obj=>{
				if (obj instanceof Object && obj.onMouseUp instanceof Function && obj.alive !== false)
					if (obj.onMouseUp.call(obj, btnCode, m.x, m.y, ev.timeStamp))
						redraw = true;
			}
			);
		}
		this.inProcess = false;
		if (redraw)
			self.draw();
	},
	onMouseMove: function(ev) {
		if (this.inProcess) {
			console.warn("Warning: callback loop prevented");
			return false;
		}
		this.inProcess = true;
		var self = this
		  , redraw = false
		  , m = this.getMousePosition(ev)
		  , nextCursor = "default";
		if ((!(this.events["mousemove"]instanceof Array)) || (this.events["mousemove"].every(func=>func.call(self, m.x, m.y)))) {
			this.objects.forEach(function(obj) {
				if (obj instanceof Object && obj.alive !== false) {
					if (obj.onMouseMove instanceof Function && obj.onMouseMove.call(obj, m.x, m.y, ev.timeStamp))
						redraw = true;
					if (((typeof obj.cursor === "string") && (nextCursor === "default")) && ((typeof obj.box === "object" && obj.box.checkBounds instanceof Function && obj.box.checkBounds(m.x, m.y)) || (obj.checkBounds instanceof Function && obj.checkBounds(m.x, m.y))))
						nextCursor = obj.cursor;
				}
			});
			this.mouse.cursor = nextCursor;
		}
		this.inProcess = false;
		if (redraw)
			self.draw();
	},
	onWheelUp: function(deltaY) {
		if ((!(this.events["wheelup"]instanceof Array)) || (this.events["wheelup"].every(obj=>obj.call(this, deltaY)))) {
			this.objects.forEach(function(obj) {
				if (obj instanceof Object && obj.onWheelUp instanceof Function && obj.alive !== false)
					obj.onWheelUp(deltaY);
			});
		}
	},
	onWheelDown: function(deltaY) {
		if ((!(this.events["wheeldown"]instanceof Array)) || (this.events["wheeldown"].every(obj=>obj.call(this, deltaY)))) {
			this.objects.forEach(function(obj) {
				if (obj instanceof Object && obj.onWheelDown instanceof Function && obj.alive !== false)
					obj.onWheelDown(deltaY);
			});
		}
	},
	onKeyUp: function(ev) {
		if (this.inProcess) {
			console.warn("Warning: callback loop prevented");
			return false;
		}
		this.inProcess = true;
		var self = this
		  , redraw = false;
		if ((!(this.events["keyup"]instanceof Array)) || (this.events["keyup"].every(func=>func.call(self, ev.keyCode, ev.ctrlKey, ev.shiftKey, ev.altKey, ev)))) {
			this.objects.forEach(function(obj) {
				if (obj instanceof Object && obj.onKeyUp instanceof Function && obj.alive !== false && obj.onKeyUp.call(obj, ev.keyCode, ev.ctrlKey, ev.shiftKey, ev.altKey, ev))
					redraw = true;
			});
		}
		this.inProcess = false;
		if (redraw)
			self.draw();
	},
	onKeyDown: function(ev) {
		if (this.inProcess) {
			console.warn("Warning: callback loop prevented");
			return true;
		}
		// Must return true if key should be processed by browser, false if it should be ignored (like a handled tab or space bar)
		var self = this
		  , redraw = false
		  , keyWasProcessed = false;
		if ((!(this.events["keydown"]instanceof Array)) || (this.events["keydown"].every(func=>func.call(self, ev.keyCode, ev.ctrlKey, ev.shiftKey, ev.altKey, ev)))) {
			this.objects.forEach(function(obj) {
				if (obj instanceof Object && obj.onKeyDown instanceof Function && obj.alive !== false && obj.onKeyDown.call(obj, ev.keyCode, ev.ctrlKey, ev.shiftKey, ev.altKey, ev))
					redraw = true;
			});
			if (redraw) {
				this.draw();
				keyWasProcessed = true;
			} else if ((ev.keyCode === 9) && (!ev.ctrlKey)) {
				// TAB
				var i, j;
				for (i = this.objects.length - 1; ((i >= 0) && (this.objects[i]instanceof Object) && !(this.objects[i].focus))
					; i--)
						if (i === -1) {
							keyWasProcessed = true;
							break;
						} else {
							j = i + 1;
							while (i !== j) {
								if ((this.objects[j]instanceof Object) && (this.objects[j].focus === false)) {
									this.objects[i].focus = false;
									this.objects[j].focus = true;
									break;
								}
								if (j >= this.objects.length)
									j = 0;
								else
									j++;
							}
							// Is currently selected element the last object that could be selected by TAB?
							keyWasProcessed = (i === j);
						}
				}
			}
			return !keyWasProcessed;
		},
		addObject: function(obj) {
			obj.parent = this;
			this.objects.push(obj);
			return obj;
		},
		addEventListener: function(type, listener) {
			if (typeof (type) === "string") {
				type = type.toLowerCase();
				if (type.substr(0, 2) == "on")
					// Cut off accidental but intuitive 'on'
					type = type.substr(2);
				var id = CanvasUpdater.prototype.eventCandidates.indexOf(type);
				if (id !== -1) {
					if (this.events[type] === undefined) {
						// Create if it's empty
						this.events[type] = [listener];
						return true;
					} else {
						id = this.events[type].indexOf(listener);
						if (id === -1) {
							this.events[type.toLowerCase()].push(listener);
							return true;
						} else
							console.warn("Warning: Specified listener was ignored because it is already connected to " + type + ".");
					}
				} else
					console.warn("Warning: Listener was ignored due to unknown argument passed: " + type + ".");
			} else
				throw "Argument Error: First argument is invalid";
			return false;
		},
		removeEventListener: function(type, listener) {
			if ((typeof (type) === "string") && (eventCandidates.indexOf(type.toLowerCase()) !== -1)) {
				type = type.toLowerCase();
				if (this.events[type]instanceof Array) {
					var id = this.events[type].indexOf(listener);
					if (id !== -1) {
						delete this.events[type][id];
					}
				}
			} else
				console.warn("Warning: Listener was ignored due to unknown argument passed.");
		},
		clearEventListener: function(type) {
			if ((typeof (type) === "string") && (eventCandidates.indexOf(type.toLowerCase()) !== -1)) {
				this.events[type.toLowerCase()] = undefined;
			} else
				console.warn("Warning: Listener was ignored due to unknown argument passed.");
		},
		getMousePosition: function(ev, extra) {
			var self = this;
			function vectorRelativeCanvasPosition(pageX, pageY) {
				return {
					x: pageX - self.canvas.offsetLeft + window.scrollX,
					y: pageY - self.canvas.offsetTop + window.scrollY
				}
			}
			if (ev instanceof MouseEvent)
				return vectorRelativeCanvasPosition(ev.clientX, ev.clientY);
			else if (ev instanceof Object && typeof ev.x === "number" && typeof ev.y === "number")
				return vectorRelativeCanvasPosition(ev.x, ev.y);
			else if (typeof ev === "number" && typeof extra === "number")
				return vectorRelativeCanvasPosition(ev.x, ev.y);
			else {
				console.warn("Warning: Unable to properly calculate relative mouse position due to invalid argument.");
				return {
					x: -1,
					y: -1
				};
			}
		}
	}
