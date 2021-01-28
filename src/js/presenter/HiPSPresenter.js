"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */
import eventBus from '../events/EventBus';
import HiPSFormatSelectedEvent from '../events/HiPSFormatSelectedEvent';
import HiPS from '../model/HiPS';
import HiPS_extractedTile from '../model/HiPS_extractedTile';
import global from '../Global';

const USE_OLD_HIPS_JS = false;

class HiPSPresenter{
	
	
	/**
	 * @param in_view: HiPSView
	 * @param in_model: HiPSDescriptor
	 */
	constructor(in_view, in_model){
		this._view = in_view;
		this._formats = [];
		this._model = in_model;
		this.retrieveHiPSProperties();
		if(global.currentHips.name === this._model.surveyName){
			this.hips = global.currentHips;
			this._view.setChecked(true);
			this.isChecked = true;
		}
		
		this._view.addCheckedHandler((event)=>{

			var checkbox = event.currentTarget;
			this.isChecked = checkbox.checked;
			if(!this.isChecked){
				this.hips.clearAllTiles();
			} else {
				if(this.hips == undefined){
					let format = this.view.getSelectedFormat();
					if(USE_OLD_HIPS_JS){
						this.hips = new HiPS(1, [0.0, 0.0, 0.0], 
							0, 
							0, this._model.surveyName, 
							this._model.url, format,
							this._maxOrder);
					} else {
						this.hips = new HiPS_extractedTile(1, [0.0, 0.0, 0.0], 
							0, 
							0, this._model.surveyName, 
							this._model.url, format,
							this._maxOrder);
					}
				} else {
					this.hips.show();
				}
				global.currentHips = this.hips;
				this.hips.refreshModel(this.hips.refreshFoV().minFoV);
			}
        });
		
		// this._view.addHiPSSettingsHandler(()=>{
		// 	console.log("clicked on HiPS settings button");
		// 	let hipsSettingsView = new HiPSSettingsView(this._model, this._formats);
		// 	// this._view.appendSettingsPopup(hipsSettingsView.getHtml());
		// 	this.fireEvents(hipsSettingsView);	
		// });

		in_view.addFormatChangedHandler((event) => {
			if(this.hips && this.isChecked){
				let format = event.target.value;
				if(USE_OLD_HIPS_JS){
					this.hips = new HiPS(1, [0.0, 0.0, 0.0], 
						0, 
						0, this._model.surveyName, 
						this._model.url, format,
						this._maxOrder);
				} else {
					this.hips = new HiPS_extractedTile(1, [0.0, 0.0, 0.0], 
						0, 
						0, this._model.surveyName, 
						this._model.url, format,
						this._maxOrder);
				}
				global.currentHips = this.hips;
	
				eventBus.fireEvent(new HiPSFormatSelectedEvent(format, this._model.surveyName));
			}
		});

		in_view.addOpacityChangedHandler((event) => {
			if(this.hips){
				this.hips.setOpacity(event.target.value/100);
			}
		});
		
	}
	
	get view(){
        return this._view;
    }
	

    retrieveHiPSProperties(){

		var xhr = new XMLHttpRequest();
		xhr.open('GET', this._model.url+"/properties", true);
		xhr.responseType = 'text';
		xhr.onload = () =>  {
			var status = xhr.status;
			if (status === 200) {
				var lines = xhr.response.split('\n');
				for(var i = 0;i < lines.length;i++){
					if (lines[i].includes("hips_tile_format")){
						let formats = lines[i].split("=")[1].trim().replace(/jpeg/ig, "jpg").split(" ");
						this._formats = formats;
						this._view.setModel(this._model, formats);
					} else if (lines[i].includes("hips_order") && !lines[i].includes("hips_order_")){
						this._maxOrder = parseInt(lines[i].split("=")[1].trim());
					}
				}

			} else {
				console.log(status, xhr.response);
			}
		};
		xhr.send();
    	
    }
	
	
	draw(pMatrix, vMatrix){
		if(this.hips && this.isChecked){
			this.hips.draw(pMatrix, vMatrix);
		}
	}
}
export default HiPSPresenter;
export {USE_OLD_HIPS_JS}