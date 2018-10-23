/*	Timestamper.js - Created by GuilhermeRossato 01/2016
 * 
 *	This class generates constant calls based on requestAnimationFrame without overloading the browser with
 * animation requests, this class will fire a callback with the number of time-chunks elapsed since the last time.
 * The class will not callback if the number of time-chunks is zero.
 * 
 *	The callback to updating is fired whenever one or more time chunks have elapsed.
 * 		First parameter is a whole number in delta time-chunks.
 * 
 * 
 * Usage Example: Call the update function at a minimum rate of 16,6ms, having each 16ms count one time-chunk:
 *  = new Timestamper(1000/60, delta => console.log(delta));
 * If the browser can keep up without problems, this function will print 60 times the number one
 * otherwise, we can only guarantee that the sum of deltas will be 60 at every whole second,
 * that is, if it takes 36 ms for the function to be called again for whatever reason, delta will
 * be the whole number 2, the left over (36%16.6 = 2,66ms) will be added at the next callback.
 * 
 * --------------------------------------------------------------------------------------------------------
 * Methods:
 * 	constructor(interval[, updateCallback]);			Class Constructor ( new Timestamper(...) )
 * 		interval			Number, time in miliseconds of a time event
 * 		updateCallback	Function, which will be called only when a interval is complete
 * 
 *	reset([interval])									Resets the updateCallback, leftover and potentially changes interval.
 * 		interval			If specified, the time-chunk interval will be changed the same way as it was created
 * 
 * --------------------------------------------------------------------------------------------------------
 * Normal Properties:
 *	.lastEvent			Number, contains numeric date of the last time a pair of update was sent
 *	.chunksElapsed		Number, contains how many chunks have elapsed since last the creation of the class
 * 	.updateCallback		Holds the function to call everytime
 *	.interval			Interval, changing this value will cause a RESET on chunksElapsed.
 * 
 * --------------------------------------------------------------------------------------------------------
 * "Private" Properties:
 * 	
 */


function Timestamper(interval, updateCallback, drawCallback) {
	if (typeof(interval) === "number") {
		var ctf = interval;
		var leftover = 0;
		var holdThis = this;
		
		Object.defineProperty(this,"interval",{
			configurable: false,
			enumerable: false,
			get: function() { return ctf; },
			set: function(v) { if (typeof(v) === "number") { ctf = v; this.chunksElapsed = 0; leftover = 0;  } else console.error("Interval parameter must be a number"); }
		});
		this.interval = 1;
		Object.defineProperty(this,"updateCallback",{
			configurable: false,
			enumerable: false,
			value: updateCallback,
			writable: true
		});
		Object.defineProperty(this,"lastEvent",{
			configurable: true,
			enumerable: false,
			value: +new Date(),
			writable: true
		});
		Object.defineProperty(this,"chunksElapsed",{
			configurable: true,
			enumerable: false,
			value: 0,
			writable: true
		});
		
		
		function step() {
			if ((holdThis instanceof Timestamper)&&(typeof(holdThis.lastEvent)==="number")&&(typeof(leftover)==="number")&&(typeof(ctf)==="number"))
			{
				var count = 0;
				var deltaMS = leftover-(holdThis.lastEvent - (holdThis.lastEvent = + new Date()));
				while ((deltaMS >= interval)&&(count = count + 1)&&(count < 50))
					deltaMS -= interval;
				if (count >= 50)
					deltaMS = 0;
				if ((updateCallback instanceof Function) && (count > 0))
					updateCallback(count);
				this.chunksElapsed += count;
				leftover = deltaMS;
				window.requestAnimationFrame(step);
			} else {
				console.error("Animation stopped - Something is false: ", (holdThis instanceof Timestamper), (typeof(holdThis.lastEvent)==="number"), (typeof(leftover)==="number"));
			}
		}
		window.requestAnimationFrame(step);
	} else
		console.error("First parameter must be a number in miliseconds");
}