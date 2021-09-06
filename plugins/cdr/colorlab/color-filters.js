/*\
title: $:/plugins/cdr/colorlab/color-filters.js
type: application/javascript
module-type: filteroperator

Filter operators for colors.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

/*
 * input:     ignored
 * parameter: index name in palette, e.g. page-background
 * output:    color value, currently an rgb[a] value
 */
exports.colour = function(source,operator,options) {
	if (operator.operand.trim().length === 0) {
		return [];
	}

	var text = "<<colour \"" + operator.operand + "\">>",
	    color = utils.wikifyText(text,options.widget);
	if (color !== "") {
		return [color];
	}

	return [];
};

exports.lightness = makeColorBinaryOperator(
	function(color_str,operand) {
		var macro = $tw.macros["color-lightness"];
		return macro.run(color_str,operand);
	}
);

exports.alpha = makeColorBinaryOperator(
	function(color_str,operand) {
		var macro = $tw.macros["color-alpha"];
		return macro.run(color_str,operand);
	}
);

exports.autocontrast = makeColorBinaryOperator(
	function(color_str,operand) {
		var macro = $tw.macros["color-autocontrast"];
		return macro.run(color_str,operand);
	}
);

exports.mute = makeColorBinaryOperator(
	function(color_str,operand) {
		var macro = $tw.macros["color-mute"];
		return macro.run(color_str,operand);
	}
);

/*
Mix input with the operand with optional second operand specifying the 
weighting for the operand (default=0.5).
*/
exports.mix = function(source,operator,options) {
	var result = [];
	var macro = $tw.macros["color-mix"];

	source(function(tiddler,title) {
		result.push(macro.run(title,operator.operands[0].trim(),operator.operands[1]));
	});
	return result;
};

/*
Mix input with the operand with optional second operand specifying the 
weighting for the operand (default=0.5).
*/
exports.deviate =  makeColorBinaryOperator(
	function(color_str,operand) {
		var macro = $tw.macros["color-deviate"];
		return macro.run(color_str,operand);
	}
);

function makeColorBinaryOperator(fnCalc) {
	return function(source,operator,options) {
		var result = [];
		    //numOperand = operator.operand.trim() === "" ? undefined : $tw.utils.parseNumber(operator.operand);

		source(function(tiddler,title) {
			result.push(fnCalc(title,operator.operand.trim()));
		});
		return result;
	};
}
})();