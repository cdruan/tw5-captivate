/*\
title: $:/plugins/cdr/colorlab/color-mute.js
type: application/javascript
module-type: macro

Adjust the saturation/chroma of the color.
\*/

(function(){

/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-mute";

exports.params = [
	{name: "color"},
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

/*
This is an ad hoc function to tone down a color. Avoid pale color to be too
gray. Make dark colors paler, i.e. bring up their lightness level.
*/
exports.run = function(color) {
	// avoid wide-gamut color space by bringing color down to sRGB
	color = (new Color(utils.wikifyText(color,this))).to("rgb");
	var lch = color.lch;
	var percent = 30;        // chroma reduction
	var lightness = lch[0];

	if (lightness >= 70) {
		var b=200; // higher the less decrease

		// lower the lightness slightly as it approaches 100
		lightness = b * Math.atan((lightness - 30)/b)+30;

		// less chroma reduction as lightness goes up
		percent = 22 * (1 + (87 - lightness)/87);
	} else if (lightness < 30) {
		lightness = 0.3 * lightness + 21;
	}

	lch[0] = lightness;
	lch[1] -= lch[1] * percent/100;
	color.lch = lch;
	return color.toString('rgb');
};
})();
