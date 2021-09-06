/*\
title: $:/plugins/cdr/colorlab/color-mix.js
type: application/javascript
module-type: macro

Mix two colors.
\*/

(function(){
/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-mix";

exports.params = [
	{name: "color1"},
	{name: "color2"},
	{name: "weight",default: 0.5}
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

/**
 * Computes weighted average of two colors in LCH color space
 * @param {Color} color1
 * @param {Color} color2
 * @param {number} [weight=0.5] weight [0..1] given to color2 in blend
 * @returns {Color} The blended color
 */
exports.run = function(color1,color2,weight) {
	color1 = new Color(utils.wikifyText(color1,this.parentWidget));
	color2 = new Color(utils.wikifyText(color2,this.parentWidget));

	if (weight === void(0) || isNaN(weight)) {
		weight = 0.5;
	} else {
		weight = isNaN(weight) ? 0.5 : parseFloat(weight);
	}

	return color1.mix(color2,weight).toString('rgb'); 
};

})();
