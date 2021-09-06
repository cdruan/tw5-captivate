/*\
title: $:/core/modules/macros/contrastcolour.js
type: application/javascript
module-type: macro

Redefine contrastcolour. Wikify the arguments first and slightly preferrs
lighter contrast to the dark one.
\*/

(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

exports.name = "contrastcolour";

exports.params = [
	{name: "target"},
	{name: "fallbackTarget"},
	{name: "colourA"},
	{name: "colourB"}
];

exports.run = function(target,fallbackTarget,colourA,colourB) {
	var colTarget = new Color(utils.wikifyText(target,this.parentWidget) || utils.wikifyText(fallbackTarget,this.parentWidget));

	var colA = new Color(utils.wikifyText(colourA,this.parentWidget));
	var colB = new Color(utils.wikifyText(colourB,this.parentWidget));

	if (colTarget.alpha === 0) {
		return colA.toString();
	}

	var contrastA = colTarget.contrast(colA),
	    contrastB = colTarget.contrast(colB);

	var lightnessTarget = colTarget.lightness();

	if (lightnessTarget <= utils.autocontrast) {
		var lightnessA = colA.lightness(),
		    lightnessB = colB.lightness();

		if (lightnessA >= lightnessB) {
			if (contrastA >= 2.35) {
				return colA.toString();
			}
		} else {
			if (contrastB >= 2.35) {
				return colB.toString();
			}
		}
	}

	return (contrastA >= contrastB ? colA.toString() : colB.toString());
};

})();
