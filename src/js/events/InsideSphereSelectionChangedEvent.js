"use strict";

class InsideSphereSelectionChangedEvent{
	
	_insideSphere;
	static name = "InsideSphereSelectionChangedEvent";
	
	constructor(in_insideSphere){
		this._insideSphere = in_insideSphere;
	}
	
	get name(){
		return InsideSphereSelectionChangedEvent.name;
	}
	
	get in_insideSphere(){
		return this._insideSphere;
	}

}
export default InsideSphereSelectionChangedEvent;