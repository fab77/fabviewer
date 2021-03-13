"use strict";

class HiPSDescriptor {
	
	#mission;
	#surveyName;
	#url;
	#maxOrder;
	#imgFormat;
	#hipsFrame;
	
	constructor(hipslist_JSON){
		
//		console.log(hipslist_JSON);
		
		this.#mission = hipslist_JSON.mission;
		this.#surveyName = hipslist_JSON.surveyName;
		let urlFromJson = hipslist_JSON.surveyRootUrl;
		if(!urlFromJson.endsWith('/')){
			urlFromJson += "/";
		}
		urlFromJson = urlFromJson.replace('cdn.skies', 'skies');

		this.#url = urlFromJson;
		this.#maxOrder = hipslist_JSON.maximumNorder;
		this.#imgFormat = hipslist_JSON.imgFormat;
		this.#hipsFrame = hipslist_JSON.hipsFrame;

	}

	get mission(){
		return this.#mission;
	}
	
	get surveyName(){
		return this.#surveyName;
	}
	
	get url(){
		return this.#url;
	}
	
	get maxOrder(){
		return this.#maxOrder;
	}
	
	get imgFormat(){
		return this.#imgFormat;
	}
	
	get hipsFrame(){
		return this.#hipsFrame;
	}
	
}

export default HiPSDescriptor;
