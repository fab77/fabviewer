"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */

import CoordinatesPanelView from '../view/CoordinatesPanelView';

class CoordinatesPanelPresenter {

	_parentView;
	_view;
	_showSphericalCoords;
	
	constructor(in_parentView){
		
		this._parentView = in_parentView;
		this._view = new CoordinatesPanelView();
		this._parentView.append2Body(this._view.getHtml());
		this._showSphericalCoords = false;
		this._view.showSphericalCoords(this._showSphericalCoords); 

	}
	
	get view(){
        return this._view;
    }
	
	update(in_raDecDeg, in_raHMS, in_decDMS, in_phi, in_theta){
		this.view.setModel(in_raDecDeg, in_raHMS, in_decDMS, in_phi, in_theta);
	}
	
	showSphericalCoords(show){
		this._showSphericalCoords(show);
		this._view.showSphericalCoords(show); 
	}
	
	
}

export default CoordinatesPanelPresenter;