"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */
import HiPSSettingsView from '../view/HiPSSettingsView';
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
		var _self = this;
		this._model = in_model;
		this.retrieveHiPSProperties();
		if(global.currentHips.name === this._model.surveyName){
			this.hips = global.currentHips;
			this._view.setChecked(true);
			this.isChecked = true;
		}
		
		this._view.addCheckedHandler(function(){

			var checkbox = this;
			_self.isChecked = checkbox.checked;
			if (checkbox.checked){
				global.currentHips.clearAllTiles();

				if(_self.hips == undefined){
					let format = _self._formats[0] == "fits" ? _self._formats[1] : _self._formats[0];
//					_self.hips = new HiPS(1, [0.0, 0.0, 0.0], 
//							Math.PI / 2, 
//							Math.PI / 2, _self._model.surveyName, 
//							_self._model.url, format,
//							_self._maxOrder);
					_self.hips = new HiPS(1, [0.0, 0.0, 0.0], 
							0, 
							0, _self._model.surveyName, 
							_self._model.url, format,
							_self._maxOrder);
				} else {
					_self.hips.show();
				}
				global.currentHips = _self.hips;
				_self.hips.refreshModel(_self.hips.refreshFoV().minFoV);
			}
        });
		
		this._view.addHiPSSettingsHandler(function(){
			console.log("clicked on HiPS settings button");
			let hipsSettingsView = new HiPSSettingsView(_self._model, _self._formats);
			_self._view.appendSettingsPopup(hipsSettingsView.getHtml());
			_self.fireEvents(hipsSettingsView);	
		});

		
	}
	
	fireEvents(in_view){
		console.log(in_view.getHiPSFormat());
		in_view.getHiPSFormat().on('change', (event) => {
			if(this.hips && this.isChecked){
				let format = event.target.value;
				console.log(format);
				this.hips = new HiPS(1, [0.0, 0.0, 0.0], 
					Math.PI / 2, 
					Math.PI / 2, this._model.surveyName, 
					this._model.url, format,
					this._maxOrder);
				global.currentHips = this.hips;

				eventBus.fireEvent(new HiPSFormatSelectedEvent(format, this._model.surveyName));
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
						this._view.setModel(this._model);
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