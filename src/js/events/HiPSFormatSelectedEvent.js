"use strict";

class HiPSFormatSelectedEvent{
	
	_format;
	_hips_name;
	static name = "HiPSFormatSelectedEvent";
	
	constructor(in_format, in_hips_name){
		this._format = in_format;
		this._hips_name = in_hips_name;
	}
	
	get name(){
		return HiPSFormatSelectedEvent.name;
	}
	
	get format(){
		return this._format;
	}

	get hipsName(){
		return this._hips_name;
	}
}

export default HiPSFormatSelectedEvent;