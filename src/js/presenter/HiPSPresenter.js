"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */
import HiPSSettingsView from '../view/HiPSSettingsView';


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
		
		
		this._view.addCheckedHandler(function(){

			var checkbox = this;

			if (checkbox.checked){
				//TODO CHANGE HiPS
				console.log("clicked on "+_self._model.surveyName);
			}
        });
		
		this._view.addHiPSSettingsHandler(function(){
			console.log("clicked on HiPS settings button");
			let hipsSettingsView = new HiPSSettingsView(_self._model, _self._formats);
			_self._view.appendSettingsPopup(hipsSettingsView.getHtml());
			
		});
		
//		this._model = null;
		
	}
	
	get view(){
        return this._view;
    }
	

    retrieveHiPSProperties(){

    	var _self = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', this._model.url+"/properties", true);
		xhr.responseType = 'text/plain';
		xhr.onload = () =>  {
			var status = xhr.status;
			if (status === 200) {
				
				var lines = xhr.response.split('\n');
				for(var i = 0;i < lines.length;i++){
					if (lines[i].includes("hips_tile_format")){
//						console.log(lines[i]);
						let formats = lines[i].split("=")[1].trim().split(" ");
						_self._formats = formats;
						_self._view.setModel(_self._model);
					}
				}

			} else {
				console.log(status, xhr.response);
			}
		};
		xhr.send();
    	
    }
    
}
export default HiPSPresenter;