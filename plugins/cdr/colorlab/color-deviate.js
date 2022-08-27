/*\
title: $:/plugins/cdr/colorlab/color-deviate.js
type: application/javascript
module-type: macro

Adjust the color a bit. If the color is on the dark side, make it slightly
lighter; and make a light color slightly darker.
\*/

(function(){

/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-deviate";

exports.params = [
	{name: "color"},
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

exports.run = function(color,value) {
	color = new Color(utils.wikifyText(color,this));

	var lightness = color.lightness;
	var adjust;

	var newval;
	if(lightness < 40) {
		newval = 0.085 * Math.pow(lightness,1.45) + 28;
	} else {
		newval = lightness - Math.pow(Math.max(100-lightness,11),0.79) * 0.4;
	}
	color.lightness = newval;
	return color.toString();
};

})();