"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */

 import FootprintsRepo from '../repos/FootprintsRepo';
 
class FootprintsSetPresenter{
	
	
	/**
	 * @param in_view: FootprintView
	 * @param in_model: FPCatalogueDescriptor
	 */
	constructor(in_view, in_model){
		this._view = in_view;
		this._model = in_model;
		
		this._view.setModel(this._model);

		var _self = this;
		
		
		this._view.addCheckedHandler(function(){

			var checkbox = this;

			if (checkbox.checked){
				console.log("clicked on FootprintSet "+_self._model.datasetName);
				FootprintsRepo.retrieveByFoV("https://sky.esa.int/", _self._model, null);	
			}else{
				FootprintsRepo.removeFPCatalogue(_self._model.name);
			}
        });
		

	}
	
	get view(){
        return this._view;
    }
	
//    set model(in_model){	// of type 
//        this._model = in_model;
//        this._view.setModel(this._model);
//    }

}
export default FootprintsSetPresenter;