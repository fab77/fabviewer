"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */
import eventBus from '../events/EventBus';
import HiPSFormatSelectedEvent from '../events/HiPSFormatSelectedEvent';
import HiPS from '../model/HiPS';
import global from '../Global';

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
		if(global.defaultHips.name === this._model.surveyName){
			this.hips = global.defaultHips;
			this._view.setChecked(true);
			this.isShowing = true;
		}
		
		this._view.addCheckedHandler((event)=>{

			var checkbox = event.currentTarget;
			this.isShowing = checkbox.checked;
			if(!this.isShowing){
				this.hips.hide();
			} else {
				if(this.hips == undefined){
					let format = this.view.getSelectedFormat();
					let opacity = this.view.getSelectedOpacity() / 100;
					this.hips = new HiPS(1, [0.0, 0.0, 0.0], 
						0, 
						0, this._model.surveyName, 
						this._model.url, format,
						this._maxOrder, opacity, this._isGalacticFrame);
					}
					this.hips.show();
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
			if(this.hips && this.isShowing){
				let format = event.target.value;
				let opacity = this.view.getSelectedOpacity() / 100;
				this.hips = new HiPS(1, [0.0, 0.0, 0.0], 
					0, 
					0, this._model.surveyName, 
					this._model.url, format,
					this._maxOrder, opacity, this._isGalacticFrame);
	
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
					} else if(lines[i].includes("hips_frame")){
						this._isGalacticFrame = "galactic" == lines[i].toLowerCase().split("=")[1].trim();
						if(this.hips){
							this.hips.setIsGalacticFrame(this._isGalacticFrame);
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
		if(this.hips){
			this.hips.refreshModelMatrix(insideSphere);
		}
	}
	
	
	draw(pMatrix, vMatrix){
		if(this.hips && this.isShowing){
			this.hips.draw(pMatrix, vMatrix);
		}
	}
}
export default HiPSPresenter;