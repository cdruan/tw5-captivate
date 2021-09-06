/*\
title: $:/plugins/cdr/colorlab/twutils.js
type: application/javascript
module-type: library

Utility functions.

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: true */
"use strict";

exports.wikifyText = function (t, parentWidget) {
	var parser = $tw.wiki.parseText("text/vnd.tiddlywiki",t,{ parseAsInline: true });
	var widgetNode = $tw.wiki.makeWidget(parser,{
			document: $tw.fakeDocument,
			parentWidget: parentWidget
		});
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return container.textContent;
}

// colors under this lightness will have white text
exports.autocontrast = 68;

var _parseCSSColor = $tw.utils.parseCSSColor;

// process hex codes separately since TW's parser doesn't accept alpha channel
// in hex codes
$tw.utils.parseCSSColor = function(str) {
	// #RGB[A] and #RRGGBB[AA] syntax.
	if (str[0] === '#') {
		if (isNaN("0x"+str.slice(1))) {
		return null;
		}
		if (str.length === 4 || str.length === 5) {
		var iv = parseInt((str+"f").slice(1,5), 16);
		return [((iv & 0xf000) >> 8) | ((iv & 0xf000) >> 12),
				(iv & 0xf00) >> 4| ((iv & 0xf00) >> 8),
				(iv & 0xf0) | ((iv & 0xf0) >> 4),
				((iv & 0xf) | ((iv & 0xf) << 4)) / 255];
		} else if (str.length === 7 || str.length === 9) {
		var iv = parseInt((str+"ff").slice(1,9), 16);
		return [(iv & 0xff000000) >>> 24,
				(iv & 0xff0000) >> 16,
				(iv & 0xff00) >> 8,
				(iv & 0xff) / 255];
		}

		return null;
	}

	var rgb = null;
	try {
		rgb = _parseCSSColor(str);
	} finally {
		return rgb;
	}
}

})();
