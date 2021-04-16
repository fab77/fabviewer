"use strict";
import SystemEntity from '../model/SystemEntity';
import global from '../Global';
import FoVUtils from '../utils/FoVUtils';
import ShowHealpixGridSelectionChangedEvent from '../events/ShowHealpixGridSelectionChangedEvent';
import eventBus from '../events/EventBus';

class SettingsPresenter{
	
	_view;
	
	constructor(in_view){
		this.init(in_view);
		var _public = {

			refreshModel: ()=>{
				this.setModel();
			},
			setSphericalCoordinates: (phiThetaDeg)=>{
				this.view.setSphericalCoordinates(phiThetaDeg);
			},
			getElapsedTime: ()=>{
				return this.elapsedTime;
			},
			toggle: ()=> {
				this.view.toggle();
			},
			close: ()=> {
				this.view.close();
			}
		}

		return _public;
	}

	init(_view){
		this._view = _view;
		this.frameTimes = [];
		this.frameCursor = 0;
		this.numFrames = 0;   
		this.maxFrames = 20;
		this.totalFPS = 0;
		this.fps = 0;
		var now = (new Date()).getTime() * 0.001;
		this.lastDrawTime = now;
		this.model = new SystemEntity();
		this.updateFpsInteger = 0;

		this.view.addFovPolyHandler(()=>{this.getFovPoly()});

		this.view.addHealpixGridCheckboxHandler((event)=>{
			eventBus.fireEvent(new ShowHealpixGridSelectionChangedEvent(event.target.checked));
		});
		this.view.addInsideSphereCheckboxHandler((event)=>{
			global.camera.setInsideSphere(event.target.checked);
			global.insideSphere = event.target.checked;
		});
		
	}
	
	setModel(){
		this.updateFpsInteger++;
		if(this.updateFpsInteger % 50 == 0){
		
			var now = (new Date()).getTime() * 0.001;
			
			this.elapsedTime = now - this.lastDrawTime;
			this.lastDrawTime = now;
			
			this.fps = 50 / this.elapsedTime;

			// add the current fps and remove the oldest fps
			this.totalFPS += this.fps - (this.frameTimes[this.frameCursor] || 0);
			// record the newest fps
			this.frameTimes[this.frameCursor++] = this.fps;
			// needed so the first N frames, before we have maxFrames, is correct.
			this.numFrames = Math.max(this.numFrames, this.frameCursor);
			// wrap the cursor
			this.frameCursor %= this.maxFrames;
			let averageFPS = this.totalFPS / this.numFrames;

			this.model.setFps(this.fps);
			this.model.setAvgFps(averageFPS);
			this.view.setModel(this.model);
		}
	}

	get view(){
		return this._view;
	}

	getFovPoly(){
		var raDecDeg = FoVUtils.getFoVPolygon(
				global.pMatrix,
				global.camera,
				global.gl.canvas,
				global.defaultHips
				);

		console.log(raDecDeg);
	};



}
export default SettingsPresenter;