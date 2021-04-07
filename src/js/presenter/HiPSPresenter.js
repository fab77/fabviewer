"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */
import eventBus from '../events/EventBus';
import HiPSFormatSelectedEvent from '../events/HiPSFormatSelectedEvent';
import HiPS from '../model/HiPS';
import global from '../Global';

class HiPSPresenter{
	
	
	_view;
	_model;
	_format;
	_hips;
	_isShowing;
	
	
	/**
	 * @param in_view: HiPSView
	 * @param in_model: HiPSDescriptor
	 */
	constructor(in_view, in_model){
		this._view = in_view;
		this._formats = [];
		this._model = in_model;
		this._hips = undefined;
		this._isShowing = false;
		
		this.retrieveHiPSProperties();
		
		if(global.defaultHips.name === this._model.surveyName){
			this._hips = global.defaultHips;
			this._view.setChecked(true);
			this._isShowing = true;
		}
		
		this._view.addCheckedHandler((event)=>{

			var checkbox = event.currentTarget;
			this._isShowing = checkbox.checked;
			if(!this._isShowing){
				this._hips.hide();
			} else {
				if(this._hips == undefined){
					let format = this.view.getSelectedFormat();
					let opacity = this.view.getSelectedOpacity() / 100;
					this._hips = new HiPS(1, [0.0, 0.0, 0.0], 
						0, 
						0, this._model.surveyName, 
						this._model.url, format,
						this._maxOrder, opacity, this._isGalacticFrame);
					}
					this._hips.show();
				this._hips.refreshModel(this._hips.refreshFoV().minFoV);
			}
        });
		
		// this._view.addHiPSSettingsHandler(()=>{
		// 	console.log("clicked on HiPS settings button");
		// 	let hipsSettingsView = new HiPSSettingsView(this._model, this._formats);
		// 	// this._view.appendSettingsPopup(hipsSettingsView.getHtml());
		// 	this.fireEvents(hipsSettingsView);	
		// });

		in_view.addFormatChangedHandler((event) => {
			if(this._hips && this._isShowing){
				let format = event.target.value;
				let opacity = this.view.getSelectedOpacity() / 100;
				this._hips = new HiPS(1, [0.0, 0.0, 0.0], 
					0, 
					0, this._model.surveyName, 
					this._model.url, format,
					this._maxOrder, opacity, this._isGalacticFrame);
	
				eventBus.fireEvent(new HiPSFormatSelectedEvent(format, this._model.surveyName));
			}
		});

		in_view.addOpacityChangedHandler((event) => {
			if(this._hips){
				this._hips.setOpacity(event.target.value/100);
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
					} else if(lines[i].includes("hips_frame")){
						this._isGalacticFrame = "galactic" == lines[i].toLowerCase().split("=")[1].trim();
						if(this._hips){
							this._hips.setIsGalacticFrame(this._isGalacticFrame);
						}
					}
				}

			} else {
				console.log(status, xhr.response);
			}
		};
		xhr.send();
    	
    }

	setInsideSphere(insideSphere){
		if(this._hips){
			this._hips.refreshModelMatrix(insideSphere);
		}
	}
	
	
	draw(pMatrix, vMatrix){
		if(this._hips && this._isShowing){
			this._hips.draw(pMatrix, vMatrix);
		}
	}
}
export default HiPSPresenter;