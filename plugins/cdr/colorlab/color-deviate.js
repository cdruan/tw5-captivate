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
	color = new Color(utils.wikifyText(color,this.parentWidget));

	var lightness = color.lightness();
	var adjust = lightness < 50 ? (lightness < 25 ? +15 : +8) : -5;

	return color.lightness(lightness + adjust).toString();
};

})();