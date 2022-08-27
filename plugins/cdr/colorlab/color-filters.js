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

exports.lightness = makeColorBinaryOperator("color-lightness");

exports.alpha = makeColorBinaryOperator("color-alpha");

exports.mute = makeColorBinaryOperator("color-mute");

/*
Mix input with the operand with optional second operand specifying the
weighting for the operand (default=0.5).
*/
exports.mix = function(source,operator,options) {
	var result = [],
		macro = $tw.macros["color-mix"];
		//colorStr = utils.wikifyText(operator.operands[0].trim(),options.widget);

	source(function(tiddler,title) {
		result.push(macro.run.call(options.widget,title,operator.operand.trim(),operator.operands[1]));
	});
	return result;
};

exports.over = makeColorBinaryOperator("color-over");

exports.autocontrast = makeColorBinaryOperator("color-autocontrast");

/*
Mix input with the operand with optional second operand specifying the
weighting for the operand (default=0.5).
*/
exports.deviate =  makeColorBinaryOperator("color-deviate");

function makeColorBinaryOperator(macroName) {
	return function(source,operator,options) {
		options = options || {widget: $tw.rootWidget};
		var result = [];
		var macro = $tw.macros[macroName];

		source(function(tiddler,title) {
			result.push(macro.run.call(options.widget,title,operator.operand.trim()));
		});
		return result;
	};
}
})();