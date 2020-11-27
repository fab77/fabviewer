"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */

 import FootprintsRepo from '../repos/FootprintsRepo';
 
class FootprintsSetPresenter{
	
	constructor(in_view){
		this._view = in_view;

		var _self = this;
		
		this._view.addCheckedHandler(function(){

			var checkbox = this;

			if (checkbox.checked){
				FootprintsRepo.retriveByFoV("https://sky.esa.int/", _self._model, null);	
			}else{
				FootprintsRepo.removeFPCatalogue(_self._model.name);
			}
        });
		
		this._model = null;
	}
	
	get view(){
        return this._view;
    }
	
    set model(in_model){	// of type 
        this._model = in_model;
        this._view.setModel(this._model);
    }

}
export default FootprintsSetPresenter;