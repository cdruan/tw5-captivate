/*\
title: $:/plugins/cdr/colorlab/lib/color.js
type: application/javascript
module-type: library

Color manipulation library

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Convert = require("$:/plugins/cdr/colorlab/lib/convert.js");
var parseColorString = require("$:/plugins/cdr/colorlab/lib/parse.js");

if (!Array.isArray) {
	Array.isArray = function (arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	};
}

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

/*
Create a Color object. If unable to process the input, rgba(0,0,0,0) is
created.

Valid inputs are:
- CSS color string
- object: {space, coords, alpha}
- array with [0..255] rgb values and optional alpha in [0..1]
- multiple arguments: space, coords, [alpha]
*/
function Color(color,optCoords,optAlpha) {
	// If we are called as a function, call using new instead
	if (!(this instanceof Color)) {
		return new Color(color,optCoords,optAlpha);
	}

	var alpha = 1;

	Object.defineProperty(this,'alpha',{
		get: function() { return alpha;},
		set: function(a) { alpha = Convert.clamp(a,0,1); }
	});

	// If input is already a Color, return a copy of itself
	if (color instanceof Color) {
		this.space = color.space;
		this.coords = color.coords.slice(0);
		this.alpha = color.alpha;
		return;
	}

	if (typeof color === "string" || color instanceof String) {
		color = parseColorString(color);
	}

	// If input is an array, assumes it contains rgb tuple in [0..255]
	if (Array.isArray(color) && color.length >= 3) {
		setupInternal.call(this,"rgb",
			color.slice(0,3).map(function(e) {return e/255;}),
			color.length > 3 ? color[3] : 1)
	} else if (color && typeof color === "object" && color.space) {
		setupInternal.call(this,color.space,color.coords,color.alpha);
	} else if (arguments.length >= 2 && Array.isArray(arguments[1])) {
		setupInternal.call(this,arguments[0],arguments[1],arguments[2]);
	} else {
		setupInternal.call(this,"rgb",[0,0,0],0);
	}
}

/*
For each color space, set up getter and setter to the coords of the
given space. Example:

coords = color.rgb;   // returns coords in rgb color space
color.lab = coords;   // changes the color by using the coords in lab space
*/
Object.keys(Convert.spaces).forEach(function(id) {
	Object.defineProperty(Color.prototype,id,{
		get: function() {
			return convert(this.space,this.coords,id);
		},
		set: function(coords) {   // e.g. color.lch = coords
			coords = coords.slice(0);
			Convert.getSpace(id).clip(coords);
			this.coords = convert(id,coords,this.space);
		}
	})
},this);

function setupInternal(space,coords,alpha) {
	if (Convert.spaces.hasOwnProperty(space)) {
		this.space  = space;
		this.coords = coords.slice(0);
		this.alpha = alpha == null ? 1 : alpha;
		Convert.getSpace(this.space).clip(this.coords);
	} else {
		throw new Error('unknown color space ' + color.space);
	}
}

/**
 * If value is given (will be clipped between [0..100]), sets the lightness
 * level to the specified value. Otherwise, returns current lightness level.
 */
 Object.defineProperty(Color.prototype,'lightness',{
	get: function() {
		return (this.lch)[0];
	},
	set: function(value) {
		var lch = this.lch;
		var lightness = lch[0];

		value = Convert.clamp(value,0,100);
		// When a color has high lightness, it's chroma is typically clipped
		// to fit in rgb, so decreasing L tends to introduce black shade;
		// try to compensate by increasing chroma first
		if (value < lightness && lightness >= 80 && lch[1] > 0.5) {
			//var adjust = 100 - 0.04 * Math.pow(50-value, 2);
			lch[1] += Math.max(20 - 0.008 * Math.pow(50-value,2),2);
		}
		lch[0] = value;
		this.lch = lch;
	}
})

/**
 * Convert to color space and return a new color
*/
Color.prototype.to = function(spaceId) {
	return new Color({
		space: spaceId,
		coords: this[spaceId],
		alpha: this.alpha
	});
}

Color.prototype.toString = function(space) {
	if (space !== void(0) && !(Convert.spaces.hasOwnProperty(space))) {
		throw new Error('unknown color space ' + space);
	}
	if (space === void(0)) {
		space = this.space;
	}
	var tuple;
	if (space === this.space) {
		tuple = this.coords;
	} else {
		tuple = this[space];
	}
	return Convert.spaces[space].toString(tuple,this.alpha);
};

Color.prototype.mixSRLAB2 = function(colorB,weight) {
	if (!(colorB instanceof Color)) {
		throw new TypeError('Input must be of type Color.');
	}

	var colorA = this;
	var labA = colorA.srlab2;
	var labB = colorB.srlab2;

	if(colorA.alpha < 1) {
		premultiply("srlab2",labA,colorA.alpha);
	}
	if(colorB.alpha < 1) {
		premultiply("srlab2",labB,colorB.alpha);
	}

	weight = Convert.clamp(weight,0,1);

	var l = labA[0] + weight * (labB[0] - labA[0]);
	var a = labA[1] + weight * (labB[1] - labA[1]);
	var b = labA[2] + weight * (labB[2] - labA[2]);

	var alpha = colorA.alpha + weight * (colorB.alpha - colorA.alpha);
	if (alpha !== 0) {
		l = l / alpha;
		a = a / alpha;
		b = b / alpha;
	}

	return (new Color({space: "srlab2",coords:[l,a,b],alpha:alpha})).to(this.space);
}

Color.prototype.mixXYZ = function(colorB,weight) {
	if (!(colorB instanceof Color)) {
		throw new TypeError('Input must be of type Color.');
	}

	var colorA = this;
	var xyzA = colorA.xyz;
	var xyzB = colorB.xyz;

	if(colorA.alpha < 1) {
		premultiply("xyz",xyzA,colorA.alpha);
	}
	if(colorB.alpha < 1) {
		premultiply("xyz",xyzB,colorB.alpha);
	}

	weight = Convert.clamp(weight,0,1);

	var x = xyzA[0] + weight * (xyzB[0] - xyzA[0]);
	var y = xyzA[1] + weight * (xyzB[1] - xyzA[1]);
	var z = xyzA[2] + weight * (xyzB[2] - xyzA[2]);

	var alpha = colorA.alpha + weight * (colorB.alpha - colorA.alpha);
	if (alpha !== 0) {
		x = x / alpha;
		y = y / alpha;
		z = z / alpha;
	}

	return (new Color({space: "xyz",coords:[x,y,z],alpha:alpha})).to(this.space);
}

Color.prototype.mix = Color.prototype.mixSRLAB2;

// returns alpha composite color (this over colorB) using the "source over" operator
Color.prototype.over = function(colorB) {
	if (!(colorB instanceof Color)) {
		throw new TypeError('Input must be of type Color.');
	}

	if(this.alpha === 1) {
		return (new Color(this));
	}
	if(this.alpha === 0) {
		return (new Color(colorB));
	}
	var rgbA = this.rgb, rgbB = colorB.rgb;

	premultiply("rgb",rgbA,this.alpha);
	premultiply("rgb",rgbB,colorB.alpha);

	var r = rgbA[0] + rgbB[0] * (1 - this.alpha),
		g = rgbA[1] + rgbB[1] * (1 - this.alpha),
		b = rgbA[2] + rgbB[2] * (1 - this.alpha),
		alpha = this.alpha + colorB.alpha * (1 - this.alpha);

	r /= alpha;
	g /= alpha;
	b /= alpha;
	return (new Color({space:"rgb",coords:[r,g,b],alpha:alpha}));
}

// returns the relative luminance of the color--"Y" component of the xyz space
Color.prototype.luminance = function() {
	var xyz = this.xyz;
	return xyz[1];
}

// returns the contrast ratio between two colors
Color.prototype.contrast = function(color) {
	if (!(color instanceof Color)) {
		throw new TypeError('Input must be of type Color.');
	}

	var L1 = this.luminance(),
	    L2 = color.luminance();

	if (L2 > L1) {
		var temp = L1;
		var L1 = L2;
		var L2 = temp;
	}

	return (L1 + .05) / (L2 + .05);
}

// deltaE2000 - http://www2.ece.rochester.edu/~gsharma/ciede2000/
Color.prototype.deltaE = function(color,konst) {
	var lab1 = this.lab,
		lab2 = color.lab;

	return deltaE(lab1,lab2,konst);
}

Color.parse = parseColorString;

// multiply (in place) any non-angle coordinate by alpha value
function premultiply(space,coords,alpha) {
	space = Convert.getSpace(space);
	coords.forEach(function(c,i,coords) {
		if (! space.coords[i].isAngle) {
			coords[i] *= alpha;
		}
	});
}

// map coords to new space, force the gamut if necessary
function convert(fromSpaceID,coords,toSpaceID) {
	var fromSpace = Convert.getSpace(fromSpaceID);
	var toSpace = Convert.getSpace(toSpaceID);

	var temp = Convert.map(fromSpace,coords,toSpace);

	if (!Convert.isInSpace(toSpace,temp) && toSpace.intoGamut) {
		temp = forceIntoGamut(fromSpace,coords,toSpace)
	}
	return temp;
}

function forceIntoGamut(fromSpace,coords,toSpace) {
	var lchSpace = Convert.getSpace("lchsr");
	var lch = Convert.map(fromSpace,coords,lchSpace);

	var transformFromLCH = function(lch,toSpace) {
		return Convert.map(lchSpace,lch,toSpace)
	}

	var temp;
	var hiC = lch[1];
	var loC = 0;
	var ε = 0.0005;

	temp = transformFromLCH(lch,toSpace);

	lch[1] /= 2;

	// .0001 chosen fairly arbitrarily as "close enough"
	while (hiC - loC > ε) {
		temp = transformFromLCH(lch,toSpace);

		if (Convert.isInSpace(toSpace,temp)) {
			loC = lch[1];
		} else {
			hiC = lch[1];
		}
		lch[1] = (hiC + loC)/2;
	}

	toSpace.clip(temp);
	return temp;
}

function deltaE(lab1,lab2,konst) {
	var kL = 1,kC = 1,kH = 1;
	if (konst !== void(0)) {
		kL = konst[0];
		kC = konst[1];
		kH = konst[2];
	}
	var	chroma1 = Math.sqrt(lab1[1]*lab1[1] + lab1[2]*lab1[2]),
		chroma2 = Math.sqrt(lab2[1]*lab2[1] + lab2[2]*lab2[2]);
	var Lavg = (lab1[0] + lab2[0]) / 2,
		C7 = Math.pow(0.5 * (chroma1 + chroma2),7),
		d2r = 0.017453292519943295,// Math.PI/180,
		P25 = 6103515625,// Math.pow(25,7),
		G = 0.5 * (1 - Math.sqrt(C7/(C7 + P25))),
		a1 = lab1[1] * (1+G),
		a2 = lab2[1] * (1+G),
		C1 = Math.sqrt(a1 * a1 + lab1[2] * lab1[2]),
		C2 = Math.sqrt(a2 * a2 + lab2[2] * lab2[2]),
		h1 = a1 == 0 && lab1[2] == 0 ? 0 : Convert.clamp360(Math.atan2(lab1[2],a1)/d2r),
		h2 = a2 == 0 && lab2[2] == 0 ? 0 : Convert.clamp360(Math.atan2(lab2[2],a2)/d2r),
		dL = lab2[0] - lab1[0],
		dC = C2 - C1,
		Cavg = (C1 + C2) / 2,
		dh = h2 - h1,
		Havg = h1 + h2;

	if (C1*C2 !== 0) {
		if (dh > 180) {
			dh = dh - 360;
			Havg = Havg < 360 ? (Havg +360) / 2 : (Havg - 360) / 2;
		} else if (dh < -180) {
			dh = dh + 360;
			Havg = Havg < 360 ? (Havg +360) / 2 : (Havg - 360) / 2;
		} else {
			Havg = Havg / 2;
		}
	}

	var dH = 2 * Math.sqrt(C1 * C2) * Math.sin(dh/2 * d2r),
		T = 1
			- 0.17 * Math.cos((Havg - 30)     * d2r)
			+ 0.24 * Math.cos((2 * Havg)      * d2r)
			+ 0.32 * Math.cos((3 * Havg + 6)  * d2r)
			- 0.20 * Math.cos((4 * Havg - 63) * d2r),
		Cavg7 = Math.pow(Cavg,7),
		Lavg2 = Math.pow(Lavg - 50,2),
		RC = 2 * Math.sqrt(Cavg7/(Cavg7 + P25)),
		SL = 1 + (0.015 * Lavg2 / Math.sqrt(20 + Lavg2)),
		SC = 1 + 0.045 * Cavg,
		SH = 1 + 0.015 * Cavg * T,
		RT = - Math.sin(60 * Math.exp(-Math.pow((Havg - 275)/25,2))*d2r) * RC;

		var dE = Math.sqrt(Math.pow(dL/(kL * SL),2)
				+ Math.pow(dC/(kC * SC),2)
				+ Math.pow(dH/(kH * SH),2)
				+ RT * dC * dH / (kC * SC * kH * SH));

	return dE;
}

module.exports = Color;

})();

//rgb [255,255,255] => xyz[0.96422, 1, 0.82521] lab[1000.00000, 0.00000, 0] lch[1000, 0, 0]
