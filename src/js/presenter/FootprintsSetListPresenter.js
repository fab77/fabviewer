"use strict";

import FPCatalogueDescriptor from '../model/FPCatalogueDescriptor';
import FootprintsSetPresenter from './FootprintsSetPresenter';
import FootprintView from '../view/FootprintView';

class FootprintsSetListPresenter{
	
	_view;
	_model;
	
	constructor(in_view){

		this._view = in_view;
		this._model = null;

	}
	
	get view(){
        return this._view;
    }
	
 
	// this cause a syntax error in Eclipse 4.15.0 since it doesn't support ES6 
	addFootprintsSet = (fpSetDescriptorJSON) => {
    	
    	for (let [key, fpSet] of Object.entries(fpSetDescriptorJSON.descriptors) ) {
			if(fpSet.mission !== "INTEGRAL") { // survey mission
				let model = new FPCatalogueDescriptor(fpSet);
				let fpSetPresenter = new FootprintsSetPresenter(new FootprintView(), model);
				this._view.addDataset(fpSetPresenter.view);
			}
    	}
    }
	
	
}
export default FootprintsSetListPresenter;