/*\
title: $:/plugins/cdr/colorlab/color-autocontrast.js
type: application/javascript
module-type: macro

Generates a contrasting color. If the given color is not too light,
returns white as the contrast color; otherwise, returns dark version
of the input color. Alpha is ignored.
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
	color = new Color(utils.wikifyText(color,this.parentWidget));
	
	var colorLight = color.lightness();
	
	if (against === "") {
		// return color based color's lightness
		if(colorLight < utils.autocontrast) {
			return "#ffffff";
		}
	
		return color.lightness(20).toString('rgb');
	} else {
		against = new Color(utils.wikifyText(against,this.parentWidget));
		var againstLight = against.lightness();
		
		if (Math.abs(colorLight - againstLight) < 30) {
			colorLight = againstLight + (againstLight < 50 ? 30 : -30);
		}
		return color.lightness(colorLight);
	}
};

})();
   