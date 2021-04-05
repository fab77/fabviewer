"use strict";

class OpenPanelEvent{
	
	_panelName;
	static name = "OpenPanelEvent";
	
	constructor(in_panelName){
		this._panelName = in_panelName;
	}
	
	get name(){
		return OpenPanelEvent.name;
	}
	
	get panelName(){
		return this._panelName;
	}
}

export default OpenPanelEvent;