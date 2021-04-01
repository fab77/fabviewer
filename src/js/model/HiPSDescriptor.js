"use strict";

class HiPSDescriptor {
	
	_mission;
	_surveyName;
	_url;
	_maxOrder;
	_imgFormat;
	_hipsFrame;
	
	constructor(hipslist_JSON){
		
//		console.log(hipslist_JSON);
		
		this._mission = hipslist_JSON.mission;
		this._surveyName = hipslist_JSON.surveyName;
		let urlFromJson = hipslist_JSON.surveyRootUrl;
		if(!urlFromJson.endsWith('/')){
			urlFromJson += "/";
		}
		urlFromJson = urlFromJson.replace('cdn.skies', 'skies');

		this._url = urlFromJson;
		this._maxOrder = hipslist_JSON.maximumNorder;
		this._imgFormat = hipslist_JSON.imgFormat;
		this._hipsFrame = hipslist_JSON.hipsFrame;

	}

	get mission(){
		return this._mission;
	}
	
	get surveyName(){
		return this._surveyName;
	}
	
	get url(){
		return this._url;
	}
	
	get maxOrder(){
		return this._maxOrder;
	}
	
	get imgFormat(){
		return this._imgFormat;
	}
	
	get hipsFrame(){
		return this._hipsFrame;
	}
	
}

export default HiPSDescriptor;
