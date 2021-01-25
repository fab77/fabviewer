"use strict";

import HiPSDescriptor from '../model/HiPSDescriptor';
import HiPSPresenter from './HiPSPresenter';
import HiPSView from '../view/HiPSView';
import { tileBufferSingleton } from '../model/TileBuffer';

class HiPSListPresenter{
	
	#view = null;
	#model = null;
	
	constructor(in_view){
		this.#view = in_view;
		this.#model = null;
		this.hipsPresenters = [];
	}
	
	get view(){
        return this.#view;
    }
	
	addHiPS = (hipsDescriptorJSON) => {
    	
		for (let [key, hipsByWavelenght] of Object.entries(hipsDescriptorJSON.menuEntries) ) {

			for (let [key2, value] of Object.entries(hipsByWavelenght) ) {
				
				if (key2 == 'hips'){
					
					for (let [key3, hips] of Object.entries(value) ) {
						
						let model = new HiPSDescriptor(hips);
			            let hipsPresenter = new HiPSPresenter(new HiPSView(), model);
						this.#view.addHiPS(hipsPresenter.view);
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
//            this.#view.addHiPS(hipsPresenter.view);
//    	}
	}

	toggle(){
		this.#view.toggle();
	}
	
	draw(pMatrix, vMatrix){
		this.hipsPresenters.forEach((hipsPresenter) => {
			hipsPresenter.draw(pMatrix, vMatrix);
		})
		tileBufferSingleton.ageTiles();
	}
	
	
}
export default HiPSListPresenter;