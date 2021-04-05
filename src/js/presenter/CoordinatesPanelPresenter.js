"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */

import CoordinatesPanelView from '../view/CoordinatesPanelView';

class CoordinatesPanelPresenter {

	_parentView;
	_view;
	
	constructor(in_parentView){
		
		this._parentView = in_parentView;
		this._view = new CoordinatesPanelView();
		this._parentView.append2Body(this._view.getHtml());
	}
	
	get view(){
        return this._view;
    }
	
	update(in_raDecDeg, in_raHMS, in_decDMS){
		this.view.setModel(in_raDecDeg, in_raHMS, in_decDMS);
	}
	
	
}

export default CoordinatesPanelPresenter;