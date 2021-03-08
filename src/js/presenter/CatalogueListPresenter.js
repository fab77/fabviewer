"use strict";

import CatalogueDescriptor from '../model/CatalogueDescriptor';
import CataloguePresenter from './CataloguePresenter';
import CatalogueView from '../view/CatalogueView';

class CatalogueListPresenter{
	
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
	addCatalogues = (catalogueDescriptorJSON) => {
		
		for (let [key, catalogue] of Object.entries(catalogueDescriptorJSON.descriptors) ) {
			let model = new CatalogueDescriptor(catalogue);
			let cataloguePresenter = new CataloguePresenter(new CatalogueView());
			cataloguePresenter.model = model;
			this.#view.addCatalogue(cataloguePresenter.view);
		}
	}
	
	
}
export default CatalogueListPresenter;