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

import SpectraPanelView from '../view/SpectraPanelView';

import HiPSPanelView from '../view/HiPSPanelView';
import HiPSListPresenter from './HiPSListPresenter';
import HiPSRepo from '../repos/HiPSRepo';

import SettingsPanelView from '../view/SettingsPanelView';
import SettingsPresenter from './SettingsPresenter';

class ControlPanelPresenter{
	
	_view;
	_parentView;
	_catalogueListPresenter;
	_catalogueRepo;
	_footprintRepo;
	_menuOpen = false;
	
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
		
		let spectraPanelView = new SpectraPanelView();
		this._spectraListPresenter = new FootprintsSetListPresenter(spectraPanelView);
		this.view.appendChild(spectraPanelView.getHtml());
		this.spectraRepo = new FootprintsRepo(global.baseUrl + "spectra", this._spectraListPresenter.addFootprintsSet);

		let hipsPanelView = new HiPSPanelView();
		this._hipsListPresenter = new HiPSListPresenter(hipsPanelView);
		this.view.appendChild(hipsPanelView.getHtml());
		this.hipsRepo = new HiPSRepo(global.baseUrl + "hips-sources", this._hipsListPresenter.addHiPS);

		let settingsPanelView = new SettingsPanelView(global.insideSphere);
		this._settingsPresenter = new SettingsPresenter(settingsPanelView);
		this.view.appendChild(settingsPanelView.getHtml());
	}
	
	get view(){
        return this._view;
    }

	addButtonsClickHandlers(){
		$("#hamburgerButton").on("click", ()=>{
			this.menuOpen = !this.menuOpen;
			$("#hamburgerButton").toggleClass("open") 
			$("#cataloguesButton").toggleClass("controlButtonVisible");	
			$("#footprintsButton").toggleClass("controlButtonVisible");	
			$("#spectraButton").toggleClass("controlButtonVisible");	
			$("#mapsButton").toggleClass("controlButtonVisible");	
			$("#settingsButton").toggleClass("controlButtonVisible");
			if(!this.menuOpen){
				this._catalogueListPresenter.view.close()
				this._footprintsListPresenter.view.close()
				this._spectraListPresenter.view.close()
				this._hipsListPresenter.view.close()
				this._settingsPresenter.close()
			}
		} );
		$("#cataloguesButton").on("click", function(){eventBus.fireEvent(new OpenPanelEvent("Catalogues")) } );
		$("#footprintsButton").on("click", function(){eventBus.fireEvent(new OpenPanelEvent("Imaging")) } );
		$("#spectraButton").on("click", function(){eventBus.fireEvent(new OpenPanelEvent("Spectra")) } );
		$("#mapsButton").on("click", function(){eventBus.fireEvent(new OpenPanelEvent("Maps")) } );
		$("#settingsButton").on("click", function(){eventBus.fireEvent(new OpenPanelEvent("Settings")) } );
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

			}else if (in_event.panelName == "Spectra"){

				this._spectraListPresenter.view.toggle()

			}else if (in_event.panelName == "Maps"){

				this._hipsListPresenter.view.toggle()

			}else if (in_event.panelName == "Settings"){

				this._settingsPresenter.toggle()

			}

			if (in_event.panelName != "Catalogues"){
				this._catalogueListPresenter.view.close()
			}
			if (in_event.panelName != "Imaging"){
				this._footprintsListPresenter.view.close()
			}
			if (in_event.panelName != "Spectra"){
				this._spectraListPresenter.view.close()
			}
			if (in_event.panelName != "Maps"){
				this._hipsListPresenter.view.close()
			}
			if (in_event.panelName != "Settings"){
				this._settingsPresenter.close()
			}

		}

	}
	
	get hipsListPresenter(){
		return this._hipsListPresenter;
	}

	refreshModel(){
		this._settingsPresenter.refreshModel();
	}

	setSphericalCoordinates(phiThetaDeg){
		this._settingsPresenter.setSphericalCoordinates(phiThetaDeg);
	}
	
	
}
export default ControlPanelPresenter;