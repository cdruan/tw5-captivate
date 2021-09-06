/*\
title: $:/plugins/cdr/colorlab/color-eval.js
type: application/javascript
module-type: macro

Returns a color string that is supported by the browser. Can be used to
"downgrade" a p3 color string on browsers that don't support p3 color space.
\*/

(function(){

/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-eval";

exports.params = [
	{name: "color"},
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

exports.run = function(color) {
	var cssColor = utils.wikifyText(color,this.parentWidget);
	color = Color.parse(cssColor);
	if (! color) {
		return "";
	}

	if (color.space && color.space !== "rgb" && $tw.browser) {
		if (window.matchMedia("(color-gamut: p3)").matches) {
			return (new Color(color)).toString("p3");
		}
		return (new Color(color)).toString("rgb");
	}
	return cssColor;
};

})();