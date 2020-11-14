"use strict";


import Catalogue from '../model/HiPSDescriptor';
import global from '../Global';

class HiPSRepo{
	
	#descriptorURL = null;
	#hipsDescriptors = [];
	static #hips = [];
	
	
	/** 
	 * @param in_descriptorURL: URI to the JSON descriptor file
	 * @param in_addHiPSCallback: callback with the retrieved descriptor JSON
	 */
	constructor(in_descriptorURL, in_addHiPSCallback){
		
		this.#descriptorURL = in_descriptorURL;
		this.getDescriptorJSON(in_addHiPSCallback);
	}
	
	getDescriptorJSON(in_addHiPSCallback){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.#descriptorURL, true);
		xhr.responseType = 'json';
		xhr.onload = () =>  {
			var status = xhr.status;
			if (status === 200) {
				this.loadHiPS(in_addHiPSCallback, null, xhr.response);
			} else {
				this.loadHiPS(in_addHiPSCallback, status, xhr.response);
			}
		};
		xhr.send();
	}
	
	
	
	loadHiPS(callback, err, data) {
		if (err !== null) {
			alert('Something went wrong: ' + err);
		} else {
			this.#hipsDescriptors.push(data);
			callback(data);
		}
	}

	static get hips(){
		return this.#hips;
	}
	
	/**
	 * @param catalogue: Catalogue.js
	 */
	static addHiPS(hips){
		this.#hips.push(hips);
	}
	
	
}

export default HiPSRepo;