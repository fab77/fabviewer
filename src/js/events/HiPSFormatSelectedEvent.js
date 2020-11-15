"use strict";

class HiPSFormatSelectedEvent{
	
	_format;
	static name = "HiPSFormatSelectedEvent";
	
	constructor(in_format){
		
		this._format = in_format;
		
	}
	
	get name(){
		return HiPSFormatSelectedEvent.name;
	}
	
	get format(){
		return this._format;
	}

}

export default HiPSFormatSelectedEvent;