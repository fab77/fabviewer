"use strict";

class Source{
	
	#point;
	#name;
	#details;

	/**
	 * 
	 * @param in_point: Point.js
	 * @param in_name: String - source name
	 * @param in_details: Object {"key": <key>, "value": <value>, "valueType": <valueType>, "unit": <unit>}
	 */
	constructor(in_point, in_name, in_details=[]){
		this.#point = in_point;
		this.#name = in_name;
		this.#details = in_details;
	}

	get point(){
		return this.#point;
	}

	get name () {
		return this.#name;
	}
}

export default Source;
