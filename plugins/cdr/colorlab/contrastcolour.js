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
	var colTarget = new Color(utils.wikifyText(target,this) || utils.wikifyText(fallbackTarget,this));

	var colA = new Color(utils.wikifyText(colourA,this));
	var colB = new Color(utils.wikifyText(colourB,this));

	if (colTarget.alpha === 0) {
		return colA.toString();
	}

	var contrastA = colTarget.contrast(colA),
	    contrastB = colTarget.contrast(colB);

	var lightnessTarget = colTarget.lightness;
	var minContrast = 3.1;

	// if target is dark enough, prefer light contrast, even if contrast ratio is insufficient
	if (lightnessTarget <= utils.MaxContrastWhite) {
		var lightnessA = colA.lightness,
		    lightnessB = colB.lightness;

		if (lightnessA >= lightnessB) {
			return (contrastA >= minContrast ? colA.toString() : "#ffffff");
		}
		return (contrastB >= minContrast ? colB.toString() : "#ffffff");
	}

	if (contrastA < minContrast && contrastB < minContrast) {
		return "#000000";
	}
	return (contrastA >= contrastB ? colA.toString() : colB.toString());
};

})();
