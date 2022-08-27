/*\

title: $:/plugins/cdr/colorlab/action-wikifypalette.js
type: application/javascript
module-type: widget

Parse the given palette and converts all entry values to color strings--execute
any macros/filters/transclusions if necessary.
\*/
(function(){

	/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var Color = require("$:/plugins/cdr/colorlab/lib/color.js");
var utils = require("$:/plugins/cdr/colorlab/twutils.js");

var WikifyPaletteWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
WikifyPaletteWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
WikifyPaletteWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
WikifyPaletteWidget.prototype.execute = function() {
	this.srcTiddler = this.getAttribute("palette",this.wiki.getTiddlerText("$:/palette"));
	this.dstTiddler = this.getAttribute("save","$:/state/wikified-palette");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
WikifyPaletteWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$message"] || changedAttributes["$prompt"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
WikifyPaletteWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var srcTiddler = this.wiki.getTiddler(this.srcTiddler);

	if (! srcTiddler) {
		return true;
	}

	var data = this.wiki.getTiddlerData(srcTiddler);

	// rgba values where r,g,b in [0..255]
	var rgbaToHex = function(rgba) {
			if (!rgba || rgba.length < 4) {
				return null;
			}
			// scale alpha to 0..255
			var alpha = Math.round(rgba[3] * 255)
			var hex = [rgba[0],rgba[1],rgba[2],alpha].map(function(e) {
				return ("0" + e.toString(16)).slice(-2);
			});

			var hexstr = "#" + hex.join("");

			if (alpha == 255) {
				return hexstr.slice(0,7);
			}

			return hexstr;
		};

	var macro = {
		body: '<$transclude tiddler="'+ this.srcTiddler + '" index="$name$"/>',
		params: [ {name: "name",default: ""} ]
	};
	this.setVariable("colour",macro.body,macro.params,true);
	this.setVariable("color",macro.body,macro.params,true);

	for (var key in data) {
		var colorString = utils.wikifyText(data[key],this);
		var color = Color.parse(colorString);
		if (color && $tw.browser && color.space && color.space !== "rgb") {
			if (window.matchMedia("(color-gamut: p3)").matches) {
				colorString = (new Color(color)).toString("p3");
			} else {
				colorString = (new Color(color)).toString("rgb");
			}
		}

		data[key] = colorString;
	}

	var newFields = {
		title: this.dstTiddler,
		tags: "$:/tags/Palette",
		name: srcTiddler.fields.name,
		description: srcTiddler.fields.description,
		type: "application/x-tiddler-dictionary",
		source: this.srcTiddler
	};
	newFields.text = $tw.utils.makeTiddlerDictionary(data);

	if(srcTiddler.fields['color-scheme']) {
		newFields['color-scheme'] = srcTiddler.fields['color-scheme'];
	}
	this.wiki.addTiddler(new $tw.Tiddler(this.wiki.getCreationFields(),newFields));
	return true; // Action was invoked
};

WikifyPaletteWidget.prototype.allowActionPropagation = function() {
	return false;
};

exports["action-wikifypalette"] = WikifyPaletteWidget;

})();