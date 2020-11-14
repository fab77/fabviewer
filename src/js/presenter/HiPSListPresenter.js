"use strict";

import HiPSDescriptor from '../model/HiPSDescriptor';
import HiPSPresenter from './HiPSPresenter';
import HiPSView from '../view/HiPSView';

class HiPSListPresenter{
	
	#view = null;
	#model = null;
	
	constructor(in_view){
		
		this.#view = in_view;
		this.#model = null;
//		var _self = this;
	}
	
	get view(){
        return this.#view;
    }
	
	// this cause a syntax error in Eclipse 4.15.0 since it doesn't support ES6 
	addHiPS = (hipsDescriptorJSON) => {
    	
//		console.log(hipsDescriptorJSON);
		
		for (let [key, hipsByWavelenght] of Object.entries(hipsDescriptorJSON.menuEntries) ) {

			for (let [key2, value] of Object.entries(hipsByWavelenght) ) {
				
//				console.log(key2+" -> "+JSON.stringify(value));

				if (key2 == 'hips'){
					
					for (let [key3, hips] of Object.entries(value) ) {
						
						let model = new HiPSDescriptor(hips);
			            let hipsPresenter = new HiPSPresenter(new HiPSView(), model);
//			            hipsPresenter.model = model;
			            this.#view.addHiPS(hipsPresenter.view);
			            
					}

				}
				
			}
		}
		
		
//    	for (let [key, hips] of Object.entries(hipsDescriptorJSON.menuEntries) ) {
//    		console.log(key+" -> "+JSON.stringify(hips));
//    		let model = new HiPSDescriptor(hips);
//            let hipsPresenter = new HiPSPresenter(new HiPSView());
//            hipsPresenter.model = model;
//            this.#view.addHiPS(hipsPresenter.view);
//    	}
    }
	
	
}
export default HiPSListPresenter;