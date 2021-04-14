"use strict";

class ShowHealpixGridSelectionChangedEvent{
	
	_shouldShowGrid;
	static name = "ShowHealpixGridSelectionChangedEvent";
	
	constructor(in_shouldShowGrid){
		this._shouldShowGrid = in_shouldShowGrid;
	}
	
	get name(){
		return ShowHealpixGridSelectionChangedEvent.name;
	}
	
	get shouldShowGrid(){
		return this._shouldShowGrid;
	}

}
export default ShowHealpixGridSelectionChangedEvent;