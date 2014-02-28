/*\
title: $:/plugins/skeeve/listselect.js
type: application/javascript
module-type: widget

listselect widget

Will set a field to the selected value:

```
	<$listselect field="myfield" filter="filter..."/>
```

|Parameter |Description |h
|tiddler |Name of the tiddler in which the field should be set. Defaults to current tiddler |
|field |The name of the field to be set |
|filter |A filter expression which should give the list of possible values |
|label |The name of a field in the currentTiddler which holds the label of the option. Default "title" |
|value |The name of a field in the currentTiddler which holds the value of the option. Default "title" |
|labelvalue |defines the character (or string) which seperates label and value |
|valuelabel |defines the character (or string) which seperates value and label |
|class |Optional class name(s) |


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ListselectWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ListselectWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ListselectWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute our attributes
	this.computeAttributes();
	// Execute our logic
	this.execute();
	// Create our elements
	this.inputDomNode = this.document.createElement("select");
	
	this.optionlist = this.getOptionList();
	this.newOptions();
	
	// Add a click event handler
	$tw.utils.addEventListeners(this.inputDomNode,[
		{name: "change", handlerObject: this, handlerMethod: "handleChangeEvent"}
	]);
	// Insert into the DOM and render any children
	parent.insertBefore(this.inputDomNode,nextSibling);
	this.renderChildren(this.inputDomNode,null);
	this.domNodes.push(this.inputDomNode);
};

/*
Compute the internal state of the widget
*/
ListselectWidget.prototype.execute = function() {
	// Get the parameters from the attributes
	this.selectTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.selectField = this.getAttribute("field");
	this.selectLabel = this.getAttribute("label");
	this.selectValue = this.getAttribute("value");
	this.selectLVSep = this.getAttribute("labelvalue");
	this.selectVLSep = this.getAttribute("valuelabel");
	this.selectedIndex = null;
	this.getOptionLabel = function(title) {
		return title;
	};
	this.getOptionValue = function(title) {
		return title;
	};
	if(this.selectLabel || this.selectValue) {
		if(this.selectLabel && this.selectLabel !== "title") {
			this.getOptionLabel = function(title) {
				var tiddler = this.wiki.getTiddler(title); 
				return tiddler && tiddler.getFieldString(this.selectLabel) || title;
			};
		}
		if(this.selectValue && this.selectValue !== "title") {
			this.getOptionValue = function(title) {
				var tiddler = this.wiki.getTiddler(title); 
				return tiddler && tiddler.getFieldString(this.selectValue) || title;
			};
		}
	}
	else if(this.selectLVSep) {
		this.getOptionLabel = function(title) {
			return (title.split(this.selectLVSep,2))[0];
		};
		this.getOptionValue = function(title) {
			return (title.split(this.selectLVSep,2))[1];
		};
	}
	else if(this.selevtVLSep) {
		this.getOptionLabel = function(title) {
			return (title.split(this.selevtVLSep,2))[1];
		};
		this.getOptionValue = function(title) {
			return (title.split(this.selevtVLSep,2))[0];
		};
	}
	this.selectClass = this.getAttribute("class","");
	if(this.selectClass !== "") {
		this.selectClass += " ";
	}
	this.selectClass += "tw-listselect";
	// Compose the list elements
	this.selectOptions = this.getOptionList();
	// this.makeChildWidgets();
};

/*
Create the list of options
*/
ListselectWidget.prototype.newOptions = function() {
	for( var i = 0 ; i < this.optionlist.label.length ; ++i) {
	    var option = this.document.createElement("option");
	    option.setAttribute("value",this.optionlist.value[i]);
	    var optiontext = this.document.createTextNode(this.optionlist.label[i]);
	    option.appendChild(optiontext);
	    this.inputDomNode.options[i] = option;
	}
	this.inputDomNode.options.length = this.optionlist.label.length;
	this.setSelectedIndex(this.getValue());
};

/*
Find the first option, matching the current value - or create an option
*/
ListselectWidget.prototype.setSelectedIndex = function(val) {
	var i = this.optionlist.value.indexOf(val);
	if(i < 0) {
		i = this.optionlist.label.length;
		var option = this.document.createElement("option");
		option.setAttribute("value",val);
		var optiontext = this.document.createTextNode(val);
		option.appendChild(optiontext);
		this.inputDomNode.options[i]= option;
	}
	this.selectedIndex = i;
	this.inputDomNode.selectedIndex = i;
};

/*
get our list of options
*/
ListselectWidget.prototype.getOptionList = function() {
	//console.log("ListselectWidget.prototype.getOptionList");
	var defaultFilter = "[!is[system]sort[title]]";
	var tiddlers = this.wiki.filterTiddlers(this.getAttribute("filter",defaultFilter),this.getVariable("currentTiddler"));
	var optionlist = { label:[""], value:[""] };
	for( var i = 0 ; i < tiddlers.length ; ++i) {
		optionlist.label.push(this.getOptionLabel(tiddlers[i]));
		optionlist.value.push(this.getOptionValue(tiddlers[i]));
	}
	return optionlist;
};

/*
retrieve the current value
*/
ListselectWidget.prototype.getValue = function() {
	var tiddler = this.wiki.getTiddler(this.selectTitle);
	return tiddler && tiddler.getFieldString(this.selectField) || "";
};

/*
set the current value
*/
ListselectWidget.prototype.setValue = function(val) {
	if(this.selectField) {
		var tiddler = this.wiki.getTiddler(this.selectTitle),
			addition = {};
		addition[this.selectField] = val;
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,addition));
	}
};

/*
set the newly selected value
*/
ListselectWidget.prototype.handleChangeEvent = function(event) {
	this.selectedIndex = event.target.selectedIndex;
   	this.setValue(event.target.value);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ListselectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.filter
		|| changedAttributes.label || changedAttributes.value
		|| changedAttributes.labelvalue || changedAttributes.valuelabel
		|| changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		// did the list of options change?
		var newoptionlist = this.getOptionList();
		identical:
		if (newoptionlist.label.length === this.optionlist.label.length) {
			// same length, compare elements
			for(var i=0 ; i < newoptionlist.label.length ; ++i) {
				if(newoptionlist.label[i] !== this.optionlist.label[i]) break identical;
				if(newoptionlist.value[i] !== this.optionlist.value[i]) break identical;
			}
			// so both lists are identical. But what about the value?
			var currentValue = this.getValue();
			if( this.selectedIndex > this.optionlist.value.length || currentValue != this.optionlist.value[this.selectedIndex] ) {
				this.setSelectedIndex(currentValue);
			}
			return true
		}
		// The list changed - create a new one.
		this.optionlist = newoptionlist;
		this.newOptions();
		return true;
	}
};

exports.listselect = ListselectWidget;

})();
