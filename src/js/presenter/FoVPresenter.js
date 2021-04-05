"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */

import FoVView from '../view/FoVView';

class FoVPresenter {

	_parentView;
	_view;
	
	constructor(in_parentView){
		
		this._parentView = in_parentView;
		this._view = new FoVView();
		this._parentView.append2Body(this._view.getHtml());
	}
	
	get view(){
        return this._view;
    }
	
	updateFoV(in_fovObj){
		this.view.setModel(in_fovObj);
	}
	
	
}

export default FoVPresenter;