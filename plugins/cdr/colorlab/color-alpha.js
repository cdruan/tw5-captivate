/*\
title: $:/plugins/cdr/colorlab/color-alpha.js
type: application/javascript
module-type: macro

Manipulate alpha component of a color or return given color's alpha value.
\*/

(function(){

/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-alpha";

exports.params = [
	{name: "color"},
	{name: "value"}
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

exports.run = function(color,value) {
	color = new Color(utils.wikifyText(color,this.parentWidget));

	if (value === void(0) || value.trim() === "") {
		return color.alpha.toString();
	}

	var num = isNaN(value) ? 0 : parseFloat(value);

	color.alpha = num;
	return color.toString('rgb');
};

})();
	