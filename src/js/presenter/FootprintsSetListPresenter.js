"use strict";

import FPCatalogueDescriptor from '../model/FPCatalogueDescriptor';
import FootprintsSetPresenter from './FootprintsSetPresenter';
import FootprintView from '../view/FootprintView';

class FootprintsSetListPresenter{
	
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
	
 
	addFootprintsSet = (fpSetDescriptorJSON) => {
    	
    	for (let [key, fpSet] of Object.entries(fpSetDescriptorJSON.descriptors) ) {
			if(fpSet.mission !== "INTEGRAL") { // survey mission
				let model = new FPCatalogueDescriptor(fpSet);
				let fpSetPresenter = new FootprintsSetPresenter(new FootprintView(), model);
				this.#view.addFPSet(fpSetPresenter.view);
			}
    	}
    }
	
	
}
export default FootprintsSetListPresenter;