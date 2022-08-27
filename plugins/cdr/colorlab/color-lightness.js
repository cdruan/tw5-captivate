/*\
title: $:/plugins/cdr/colorlab/color-lightness.js
type: application/javascript
module-type: macro

Manipulate lightness component of a color (in LCH space) or return given
color's lightness value.
\*/

(function(){

/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-lightness";

exports.params = [
	{name: "color"},
	{name: "value"}
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

exports.run = function(color,value) {
	color = new Color(utils.wikifyText(color,this));

	if (value === void(0) || value.trim() === "") {
		return color.lightness.toString();
	}

	var num, lightness = color.lightness;

	if (!isNaN(value)) {
		num = parseFloat(value);
		if(value[0] === "+" || value[0] === "-") {
			num += lightness;
			num = Math.min(Math.max(0,num),100);
		}
	} else {
		var re = /^\s*(min|max|range)\(([^)]+)\)\s*$/;
		var m = value.match(re);

		if (m) {
			switch(m[1]) {
			case "min":
				num = parseFloat(m[2]);
				num = Math.min(Math.max(num,lightness),100);
				break;
			case "max":
				num = parseFloat(m[2]);
				num = Math.max(Math.min(num,lightness),0);
				break;
			case "range":
				var args = m[2].split(',');
				args[0] = parseFloat(args[0]) || 0;
				args[1] = parseFloat(args[1]) || 0;
				num = Math.min(Math.max(lightness,args[0]),args[1]);
				break;
			}
		} else {
			num = 0;
		}
	}

	color.lightness = num;
	return color.toString();
};

})();
