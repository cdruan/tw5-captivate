/*\
title: $:/plugins/cdr/colorlab/lib/parse.js
type: application/javascript
module-type: library

Parses a css color specification

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */

"use strict";

// https://www.w3.org/TR/css-color-4/#named-colors
var NamedColors = {
	"aliceblue": [240,248,255],	"antiquewhite": [250,235,215],
	"aqua": [0,255,255],	"aquamarine": [127,255,212],
	"azure": [240,255,255],	"beige": [245,245,220],
	"bisque": [255,228,196],	"black": [0,0,0],
	"blanchedalmond": [255,235,205],	"blue": [0,0,255],
	"blueviolet": [138,43,226],	"brown": [165,42,42],
	"burlywood": [222,184,135],	"cadetblue": [95,158,160],
	"chartreuse": [127,255,0],	"chocolate": [210,105,30],
	"coral": [255,127,80],	"cornflowerblue": [100,149,237],
	"cornsilk": [255,248,220],	"crimson": [220,20,60],
	"cyan": [0,255,255],	"darkblue": [0,0,139],
	"darkcyan": [0,139,139],	"darkgoldenrod": [184,134,11],
	"darkgray": [169,169,169],	"darkgreen": [0,100,0],
	"darkgrey": [169,169,169],	"darkkhaki": [189,183,107],
	"darkmagenta": [139,0,139],	"darkolivegreen": [85,107,47],
	"darkorange": [255,140,0],	"darkorchid": [153,50,204],
	"darkred": [139,0,0],	"darksalmon": [233,150,122],
	"darkseagreen": [143,188,143],	"darkslateblue": [72,61,139],
	"darkslategray": [47,79,79],	"darkslategrey": [47,79,79],
	"darkturquoise": [0,206,209],	"darkviolet": [148,0,211],
	"deeppink": [255,20,147],	"deepskyblue": [0,191,255],
	"dimgray": [105,105,105],	"dimgrey": [105,105,105],
	"dodgerblue": [30,144,255],	"firebrick": [178,34,34],
	"floralwhite": [255,250,240],	"forestgreen": [34,139,34],
	"fuchsia": [255,0,255],	"gainsboro": [220,220,220],
	"ghostwhite": [248,248,255],	"gold": [255,215,0],
	"goldenrod": [218,165,32],	"gray": [128,128,128],
	"green": [0,128,0],	"greenyellow": [173,255,47],
	"grey": [128,128,128],	"honeydew": [240,255,240],
	"hotpink": [255,105,180],	"indianred": [205,92,92],
	"indigo": [75,0,130],	"ivory": [255,255,240],
	"khaki": [240,230,140],	"lavender": [230,230,250],
	"lavenderblush": [255,240,245],	"lawngreen": [124,252,0],
	"lemonchiffon": [255,250,205],	"lightblue": [173,216,230],
	"lightcoral": [240,128,128],	"lightcyan": [224,255,255],
	"lightgoldenrodyellow": [250,250,210],	"lightgray": [211,211,211],
	"lightgreen": [144,238,144],	"lightgrey": [211,211,211],
	"lightpink": [255,182,193],	"lightsalmon": [255,160,122],
	"lightseagreen": [32,178,170],	"lightskyblue": [135,206,250],
	"lightslategray": [119,136,153],	"lightslategrey": [119,136,153],
	"lightsteelblue": [176,196,222],	"lightyellow": [255,255,224],
	"lime": [0,255,0],	"limegreen": [50,205,50],
	"linen": [250,240,230],	"magenta": [255,0,255],
	"maroon": [128,0,0],	"mediumaquamarine": [102,205,170],
	"mediumblue": [0,0,205],	"mediumorchid": [186,85,211],
	"mediumpurple": [147,112,219],	"mediumseagreen": [60,179,113],
	"mediumslateblue": [123,104,238],	"mediumspringgreen": [0,250,154],
	"mediumturquoise": [72,209,204],	"mediumvioletred": [199,21,133],
	"midnightblue": [25,25,112],	"mintcream": [245,255,250],
	"mistyrose": [255,228,225],	"moccasin": [255,228,181],
	"navajowhite": [255,222,173],	"navy": [0,0,128],
	"oldlace": [253,245,230],	"olive": [128,128,0],
	"olivedrab": [107,142,35],	"orange": [255,165,0],
	"orangered": [255,69,0],	"orchid": [218,112,214],
	"palegoldenrod": [238,232,170],	"palegreen": [152,251,152],
	"paleturquoise": [175,238,238],	"palevioletred": [219,112,147],
	"papayawhip": [255,239,213],	"peachpuff": [255,218,185],
	"peru": [205,133,63],	"pink": [255,192,203],
	"plum": [221,160,221],	"powderblue": [176,224,230],
	"purple": [128,0,128],	"rebeccapurple": [102,51,153],
	"red": [255,0,0],	"rosybrown": [188,143,143],
	"royalblue": [65,105,225],	"saddlebrown": [139,69,19],
	"salmon": [250,128,114],	"sandybrown": [244,164,96],
	"seagreen": [46,139,87],	"seashell": [255,245,238],
	"sienna": [160,82,45],	"silver": [192,192,192],
	"skyblue": [135,206,235],	"slateblue": [106,90,205],
	"slategray": [112,128,144],	"slategrey": [112,128,144],
	"snow": [255,250,250],	"springgreen": [0,255,127],
	"steelblue": [70,130,180],	"tan": [210,180,140],
	"teal": [0,128,128],	"thistle": [216,191,216],
	"tomato": [255,99,71],	"turquoise": [64,224,208],
	"violet": [238,130,238],	"wheat": [245,222,179],
	"white": [255,255,255],	"whitesmoke": [245,245,245],
	"yellow": [255,255,0],	"yellowgreen": [154,205,50]
};

var Numeric = "([-+]?(?:0|[1-9]\\d*|(?=\\.\\d+))(?:\\.\\d*)?(?:[eE][-+]?\\d+)?)";
var NumberUnit = new RegExp("^"+Numeric+"([a-z%]*)$");

/*
 * Arguments to color functions may be separated by either spaces or commas.
 * Alpha channel specified after " / " takes precedence over alpha component in
 * a color tuple.
 *
 * Returns either:
 * 1) an rgb array with components in [0..255], or
 * 2) an object with space, coords, and alpha properties, or
 * 3) null
 */
module.exports = function parseColorString(str) {
	if (typeof str !== "string" && ! (str instanceof String)) {
		return null;
	}

	str = str.trim().toLowerCase();

	if (str === "transparent") {
		return {space:"rgb",coords:[0,0,0],alpha:0};
	}

	if (NamedColors.hasOwnProperty(str)) {
		return NamedColors[str];
	}

	if (str[0] === "#") {
		return parseHex(str);
	}

	var re = /^([a-z]+)\(([^)]+)\)$/;
	var m = str.match(re);

	if (!m) {
		return null;
	}

	var alpha = 1;
	var isColorFn = (m[1] === "color");
	var coords = m[2].trim().split(/\s*,\s*|\s+/);
	var func = (isColorFn ? coords.shift() : m[1]);

	var i = coords.indexOf("/");
	if (i >= 0) {
		if (coords.length <= i+1) {
			return null;
		}
		var alphaStr = coords[i+1];
		coords.splice(i);
		alpha = parseNumberOrPercent(alphaStr);
	} else if (coords.length > 3) {
		alpha = parseNumberOrPercent(coords[3]);
	}

	if (alpha === undefined) {
		return null;
	}

	// per css4 color() spec:
	// If more <number>s or <percentage>s are provided than parameters that the
	// color space takes, the excess <number>s at the end are ignored.
	// If fewer <number>s or <percentage>s are provided than parameters that the
	// color space takes, the missing parameters default to 0.
	coords.splice(3);
	if (coords.length < 3) {
		if (! isColorFn) {
			return null;
		}
		// pad missing entries with 0
		for (var i = 3 - coords.length; i > 0; i--) {
			coords.push("0");
		}
	}
	var space;

	switch(func) {
		case "rgb":
		case "rgba":
			space = "rgb";
			coords = parseCoordsRGB(coords,255);
			break;
		case "hsl":
		case "hsla":
			space = "hsl";
			coords = parseCoordsHSL(coords);
			break;
		case "display-p3":
			space = "p3";
			coords = parseCoordsRGB(coords);
			break;
		case "lab":
			space = "lab";
			coords = parseCoordsLab(coords);
			break;
		case "srgb":
			space = "rgb";
			coords = parseCoordsRGB(coords);
			break;
		default:
			return null;
	}

	if (coords === null) {
		return null;
	}
	return { space:space, coords:coords, alpha:alpha };
}

// convert percentage to float; if str is a number and scale is provided, return
// the number divided by the scale.
function parseNumberOrPercent(str,scale) {
	if (str === "none") return NaN;

	var m = str.match(NumberUnit);
	if (!m) {
		return undefined;
	}
	if (m[2] === "%") {
		return parseFloat(m[1]/100);
	}
	var n = parseFloat(m[1]);
	if (scale !== void(0) && scale > 0) {
		n = n / scale;
	}
	return n;
}

function parseNumber(str) {
	if (str === "none") return NaN;

	var m = str.match(NumberUnit);
	if (!m || m[2] !== "") {
		return undefined;
	}

	return parseFloat(m[1]);
}

// returns hue in degrees
function parseHue(str) {
	if (str === "none") return NaN;

	var m = str.match(NumberUnit);
	if (!m) {
		return undefined;
	}
	var n = parseFloat(m[1]);

	switch(m[2]) {
	case "":
	case "deg":
		break;
	case "rad":
		n = n * 180 / Math.PI;
		break;
	case "grad":  // 400 gradians in a circle
		n = n * 360 / 400;
		break;
	case "turn":  // 1 turn in a circle
		n = n * 360;
		break;
	default:
		return undefined;
	}
	return n;
}

function parsePercent(str) {
	if (str === "none") return NaN;

	var m = str.match(NumberUnit);
	if (!m || m[2] !== "%") {
		return undefined;
	}
	return parseFloat(m[1])/100;
}

// assumes the first character is "#"
function parseHex(str) {
	if (str === "none") return NaN;

	// #RGB[A] and #RRGGBB[AA] syntax.
	if (isNaN("0x"+str.slice(1))) {
		return undefined;
	}
	if (str.length === 4 || str.length === 5) {
		var iv = parseInt((str+"f").slice(1,5),16);
		return [((iv & 0xf000) >> 8) | ((iv & 0xf000) >> 12),
				(iv & 0xf00) >> 4| ((iv & 0xf00) >> 8),
				(iv & 0xf0) | ((iv & 0xf0) >> 4),
				((iv & 0xf) | ((iv & 0xf) << 4)) / 255];
	} else if (str.length === 7 || str.length === 9) {
		var iv = parseInt((str+"ff").slice(1,9),16);
		return [(iv & 0xff000000) >>> 24,
				(iv & 0xff0000) >> 16,
				(iv & 0xff00) >> 8,
				(iv & 0xff) / 255];
	}

	return undefined;
}

// Numbers are interpreted from [0..scale] or [0..1] by default.
function parseCoordsRGB(coords,scale) {
	for (var i = 0; i < 3; i++) {
		coords[i] = parseNumberOrPercent(coords[i],scale);
		if (coords[i] === undefined) {
			return null;
		}
	}
	return coords;
}

// Adapted from https://www.w3.org/TR/css-color-4/#hsl-to-rgb
// Returns RGB components in [0..1]
function parseCoordsHSL(coords) {
	var hsl = [
		parseHue(coords[0]),
		parsePercent(coords[1]),
		parsePercent(coords[2])
	];

	if (hsl.includes(undefined)) {
		return null;
	}

	return hsl;
}

function parseCoordsLab(coords) {
	var lab = [
		parsePercent(coords[0]) * 100,
		parseNumber(coords[1]),
		parseNumber(coords[2])
	];

	if (lab.includes(undefined)) {
		return null;
	}

	return lab;
}

})();
