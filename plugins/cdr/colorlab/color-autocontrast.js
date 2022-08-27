/*\
title: $:/plugins/cdr/colorlab/color-autocontrast.js
type: application/javascript
module-type: macro

Generates a contrasting color. If the given color is dark enough,
returns white as the contrast color; otherwise, returns the darker version
of the input color. Alpha is ignored.

When given the optional "against" parameter, generate constrasting color against
this parameter.
\*/

(function(){

/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-autocontrast";

exports.params = [
	{name: "color"},
	{name: "against"}
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

exports.run = function(color,against) {
	color = new Color(utils.wikifyText(color,this));

	var colorLight = color.lightness;

	if (against === "") {
		// return color based color's lightness
		if(colorLight < utils.MaxContrastWhite) {
			return "#ffffff";
		}

		color.lightness = 20;
		return color.toString('rgb');
	} else {
		against = new Color(utils.wikifyText(against,this));
		var againstLight = against.lightness;

		if (Math.abs(colorLight - againstLight) < 35) {
			colorLight = againstLight + (againstLight < 50 ? 35 : -35);
		}
		color.lightness = colorLight;
		return color.toString('rgb');
	}
};

})();
