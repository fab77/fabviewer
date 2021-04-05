"use strict";

import CatalogueDescriptor from '../model/CatalogueDescriptor';
import CataloguePresenter from './CataloguePresenter';
import CatalogueView from '../view/CatalogueView';

class CatalogueListPresenter{
	
	_view;
	_model;
	
	constructor(in_view){
		
		this._view = in_view;
		this._model = null;
//		var _self = this;
	}
	
	get view(){
		return this._view;
	}
	
	// this cause a syntax error in Eclipse 4.15.0 since it doesn't support ES6 
	addCatalogues = (catalogueDescriptorJSON) => {
		
		for (let [key, catalogue] of Object.entries(catalogueDescriptorJSON.descriptors) ) {
			let model = new CatalogueDescriptor(catalogue);
			let cataloguePresenter = new CataloguePresenter(new CatalogueView());
			cataloguePresenter.model = model;
			this._view.addCatalogue(cataloguePresenter.view);
		}
	}
	
	
}
export default CatalogueListPresenter;