"use strict";

class HiPSDescriptor {
	
	#mission;
	#surveyName;
	#url;
	#maxOrder;
	#imgFormat;
	#fits;
	
	constructor(hipslist_JSON){
		
//		console.log(hipslist_JSON);
		
		this.#mission = hipslist_JSON.mission;
		this.#surveyName = hipslist_JSON.surveyName;
		this.#url = hipslist_JSON.surveyRootUrl;
		this.#maxOrder = hipslist_JSON.maximumNorder;
		this.#imgFormat = hipslist_JSON.imgFormat;
		this.#fits = true;

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
	
	get fits(){
		return this.#fits;
	}
	
}

export default HiPSDescriptor;
