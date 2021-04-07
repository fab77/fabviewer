"use strict";

import HiPSDescriptor from '../model/HiPSDescriptor';
import HiPSPresenter from './HiPSPresenter';
import HiPSView from '../view/HiPSView';
import { tileBufferSingleton } from '../model/TileBuffer';
import InsideSphereSelectionChangedEvent from '../events/InsideSphereSelectionChangedEvent';
import eventBus from '../events/EventBus';
import { healpixGridTileBufferSingleton } from '../model/HealpixGridTileBuffer';

class HiPSListPresenter{
	
	_view;
	_model;
	
	constructor(in_view){
		this._view = in_view;
		this._model = null;
		this.hipsPresenters = [];
		this.timeCounter = 0;
		eventBus.registerForEvent(this, InsideSphereSelectionChangedEvent.name);
	}
		
	notify(in_event){
		if (in_event instanceof InsideSphereSelectionChangedEvent){
			this.hipsPresenters.forEach(hipsPresenter => {
				hipsPresenter.setInsideSphere(in_event.insideSphere);
			});
		}
	}
	
	get view(){
        return this._view;
    }
	
	addHiPS = (hipsDescriptorJSON) => {
    	
		for (let [key, hipsByWavelenght] of Object.entries(hipsDescriptorJSON.menuEntries) ) {

			for (let [key2, value] of Object.entries(hipsByWavelenght) ) {
				
				if (key2 == 'hips'){
					
					for (let [key3, hips] of Object.entries(value) ) {
						
						let model = new HiPSDescriptor(hips);
			            let hipsPresenter = new HiPSPresenter(new HiPSView(), model);
						this._view.addHiPS(hipsPresenter.view);
						this.hipsPresenters.push(hipsPresenter);
					}

				}
				
			}
		}
		
		
//    	for (let [key, hips] of Object.entries(hipsDescriptorJSON.menuEntries) ) {
//    		console.log(key+" -> "+JSON.stringify(hips));
//    		let model = new HiPSDescriptor(hips);
//            let hipsPresenter = new HiPSPresenter(new HiPSView());
//            hipsPresenter.model = model;
//            this._view.addHiPS(hipsPresenter.view);
//    	}
	}

	getVisibleModels(){
		let models = [];
		this.hipsPresenters.forEach(hipsPresenter => {
			if (hipsPresenter.isShowing) {
				models.push(hipsPresenter.hips);
			}
		});
		return models;
	}

	toggle(){
		this._view.toggle();
	}
	
	draw(pMatrix, vMatrix){
		this.hipsPresenters.forEach((hipsPresenter) => {
			hipsPresenter.draw(pMatrix, vMatrix);
		})
		if(this.timeCounter % 600 == 0){ // ~Every 10 seconds
			tileBufferSingleton.ageTiles();
			healpixGridTileBufferSingleton.ageTiles();
		}
		this.timeCounter++
	}
	
	
}
export default HiPSListPresenter;