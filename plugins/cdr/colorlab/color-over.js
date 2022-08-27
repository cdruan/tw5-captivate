/*\
title: $:/plugins/cdr/colorlab/color-over.js
type: application/javascript
module-type: macro

Alpha composite with source over operator
\*/

(function(){
/* jslint node: true, browser: true */
/* global $tw: false */
"use strict";

exports.name = "color-over";

exports.params = [
	{name: "top"},
	{name: "bottom"},
];

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

/**
 * Computes weighted average of two colors in LCH color space
 * @param {Color} top top color
 * @param {Color} bottom bottom color
 * @returns {Color} returns top over bottom composite result
 */
exports.run = function(top,bottom) {
	top = new Color(utils.wikifyText(top,this));
	bottom = new Color(utils.wikifyText(bottom,this));

	return top.over(bottom).toString('rgb');
};

})();
