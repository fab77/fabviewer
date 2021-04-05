/**
 * @author Fabrizio Giordano (Fab)
 */
"use strict";

import $ from "jquery";

import global from '../Global';


import eventBus from '../events/EventBus';
import OpenPanelEvent from '../events/OpenPanelEvent';

import ControlPanelView from '../view/ControlPanelView';


import FootprintPanelView from '../view/FootprintPanelView';
import FootprintListView from '../view/FootprintListView';
import FootprintsSetListPresenter from './FootprintsSetListPresenter';
import FootprintsRepo from '../repos/FootprintsRepo';

import CataloguePanelView from '../view/CataloguePanelView';
import CatalogueListView from '../view/CatalogueListView';
import CatalogueListPresenter from './CatalogueListPresenter';
import CatalogueRepo from '../repos/CatalogueRepo';


class ControlPanelPresenter{
	
	_view;
	_parentView;
	_catalogueListPresenter;
	_catalogueRepo;
	_footprintRepo;
	
	constructor(in_parentView){
		
		this._parentView = in_parentView;
		
		this._view  = new ControlPanelView();
		
		this.initPresenters();
		
		this._parentView.appendChild2(this._view.html);
		
		this.addButtonsClickHandlers();
		
		this.registerForEvents();

	}
		

	initPresenters(){

		let cataloguePanelView = new CataloguePanelView();
		this._catalogueListPresenter = new CatalogueListPresenter(cataloguePanelView);
		this.view.appendChild(cataloguePanelView.getHtml());
		this.catalogueRepo = new CatalogueRepo(global.baseUrl + "catalogs", this._catalogueListPresenter.addCatalogues);


		let footprintPanelView = new FootprintPanelView();
		this._footprintsListPresenter = new FootprintsSetListPresenter(footprintPanelView);
		this.view.appendChild(footprintPanelView.getHtml());
		this.footprintRepo = new FootprintsRepo(global.baseUrl + "observations", this._footprintsListPresenter.addFootprintsSet);

	}
	
	get view(){
        return this._view;
    }

	addButtonsClickHandlers(){
		
		let self = this;
		
		$("#cataloguesButton").on("click", function(){eventBus.fireEvent(new OpenPanelEvent("Catalogues")) } );
		$("#footprintsButton").on("click", function(){eventBus.fireEvent(new OpenPanelEvent("Imaging")) } );
	
	}

	registerForEvents(){
	
		eventBus.registerForEvent(this, OpenPanelEvent.name);

	}
	
	notify(in_event){

		if (in_event instanceof OpenPanelEvent){
			
			if (in_event.panelName == "Catalogues"){

				this._catalogueListPresenter.view.toggle()

			}else if (in_event.panelName == "Imaging"){

				this._footprintsListPresenter.view.toggle()

			}
		}

	}
	
	
	
}
export default ControlPanelPresenter;