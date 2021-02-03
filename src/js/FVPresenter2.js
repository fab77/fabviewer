//"use strict";
/**
 * @author Fabrizio Giordano (Fab)
 */

//import Camera2 from './model/Camera2';
import Camera3 from './model/Camera3';

import RayPickingUtils from './utils/RayPickingUtils';


import SystemView from './view/SystemView';
import SystemPresenter from './presenter/SystemPresenter';

import CatalogueListView from './view/CatalogueListView';
import CatalogueListPresenter from './presenter/CatalogueListPresenter';

import FootprintListView from './view/FootprintListView';
import FootprintsSetListPresenter from './presenter/FootprintsSetListPresenter';

import HiPSListView from './view/HiPSListView';
import HiPSListPresenter from './presenter/HiPSListPresenter';

import FITSView from './view/FITSView';
import FITSPresenter from './presenter/FITSPresenter';

import SourceSelectionView from './view/SourceSelectionView';
import SourceSelectionPresenter from './presenter/SourceSelectionPresenter';

import CatalogueRepo from './repos/CatalogueRepo';
import FootprintsRepo from './repos/FootprintsRepo';
import ModelRepo from './repos/ModelRepo';
import HiPSRepo from './repos/HiPSRepo';

import {mat4, vec3} from 'gl-matrix';
import {cartesianToSpherical, sphericalToAstroDeg, astroDegToSpherical, sphericalToCartesian, raDegToHMS, decDegToDMS, degToRad} from './utils/Utils';
import FoVUtils from './utils/FoVUtils';
import global from './Global';
import {Vec3, Pointing} from 'healpixjs';
import HiPS from './model/HiPS';
import {USE_OLD_HIPS_JS} from './presenter/HiPSPresenter';
import HiPS_extractedTile from './model/HiPS_extractedTile';
import {visibleTilesManager} from './model/VisibleTilesManager';
import HealpixGrid from './model/HealpixGrid';

class FVPresenter2{
	constructor(in_view, in_gl){
		this.in_gl = in_gl;
		if (DEBUG){
			console.log("[FVPresenter::FVPresenter]");
		}

		this.nearestModel;
		this.enableCatalogues = true;
		this.init(in_view);
	}
	
	init(in_view){
		if (DEBUG){
			console.log("[FVPresenter::init]");
		}
		this.view = in_view;
		this.enableCatalogues = true;
		this.then = 0;
		this.camera = new Camera3([0.0, 0.0, 3.0]);
		global.camera = this.camera;
		this.raypicker = new RayPickingUtils();
		global.rayPicker = this.raypicker; 
		
		this.initPresenter();
		
		this.catalogueRepo = new CatalogueRepo("https://sky.esa.int/esasky-tap/catalogs", this.catalogueListPresenter.addCatalogues);
		
		this.footprintsRepo = new FootprintsRepo("https://sky.esa.int/esasky-tap/observations", this.footprintsSetListPresenter.addFootprintsSet);
		
		// this.modelRepo = new ModelRepo(this.in_gl, this.view.canvas, this.catalogueListPresenter.addCatalogues); 
		
		this.hipsRepo = new HiPSRepo("https://sky.esa.int/esasky-tap/hips-sources", this.hipsListPresenter.addHiPS);
		
		this.aspectRatio;
		this.fovDeg = 45;
		this.nearPlane = 0.001;
		this.farPlane = 2.5;
		
		// projection matrix
		this.pMatrix = mat4.create();
		
		this.mouseDown = false;
		this.lastMouseX = null;
		this.lastMouseY = null;
		this.inertiaX = 0.0;
		this.inertiaY = 0.0;
		this.zoomInertia = 0.0;

		
		this.addEventListeners();
		
		this.currentSeconds;
		this.elapsedTime;
		this.previousSeconds;
		
		this.nearestVisibleObjectIdx = 0;
		
		if(USE_OLD_HIPS_JS){
			global.currentHips = new HiPS(1, [0.0, 0.0, 0.0], 
				0, 
				0, "DSS2 color", "//skies.esac.esa.int/DSSColor/", "jpg", 9);
		} else {
			global.currentHips = new HiPS_extractedTile(1, [0.0, 0.0, 0.0], 
				0, 
				// 0, "INTEGRAL-IBIS 65-100 keV", "//skies.esac.esa.int/Integral/65-100/", "fits", 3);
				// 0, "Herschel SPIRE 500 micron", "//skies.esac.esa.int/Herschel/normalized/hips500_pnorm_allsky/", "fits", 5);
				// 0, "Herschel SPIRE 500 micron", "//skies.esac.esa.int/Herschel/normalized/hips500_pnorm_allsky/", "png", 5);
				0, "DSS2 color", "//skies.esac.esa.int/DSSColor/", "jpg", 9);
		}
		this.view.setPickedObjectName(global.currentHips);
		
		this.lastDrawTime = (new Date()).getTime() * 0.001;

		let startRADecDeg = [228.7331, 56.3107];
		
//		let phiThetaDeg = astroDegToSpherical(startRADecDeg[0], startRADecDeg[1]);
		
		let phiThetaDeg = {phi: 228.7331, theta: 33.6887};
		
		let phiThetaRad = [degToRad(phiThetaDeg.phi), degToRad(phiThetaDeg.theta)];

		let xyz = sphericalToCartesian(phiThetaDeg.phi, phiThetaDeg.theta);
		
//		this.camera.rotate(phiThetaRad[0], phiThetaRad[1]);

		this.view.addHipsButtonHandler(()=>{
			this.hipsListPresenter.toggle();
		});

		this.healpixGrid = new HealpixGrid();

		this.view.addHealpixGridCheckboxHandler((event)=>{
			this.showHealpixGrid = event.target.checked;
		});
	};
	
	initPresenter(){
		
		let hipsListView = new HiPSListView();
		this.hipsListPresenter = new HiPSListPresenter(hipsListView);
		this.view.appendChild(hipsListView.getHtml());
		
		var systemView = new SystemView();
		this.systemPresenter = new SystemPresenter(systemView);
		this.view.appendChild(systemView.getHtml());
		this.systemPresenter.addFovPolyHandler(()=>{this.getFovPoly()});
		
		var catalogueListView = new CatalogueListView();
		this.catalogueListPresenter = new CatalogueListPresenter(catalogueListView);
		this.view.appendChild(catalogueListView.getHtml());
		
		
		var footprintListView = new FootprintListView();
		this.footprintsSetListPresenter = new FootprintsSetListPresenter(footprintListView);
		this.view.appendChild(footprintListView.getHtml());
		
		
		var sourceSelView = new SourceSelectionView();
		this.sourceSelectionPresenter = new SourceSelectionPresenter(sourceSelView);
		this.view.appendChild(sourceSelView.html);
		
		// var fitsView = new FITSView();
		// this.view.appendChild(fitsView.html);
		// this.fitsPresenter = new FITSPresenter(fitsView, this.enableFitsCallback);		
		
	};
	
	getFovPoly(){

		console.log("this.getFovPoly");
		
		var raDecDeg = FoVUtils.getFoVPolygon(
				this.pMatrix,
				this.camera,
				this.in_gl.canvas,
				(global.currentHips)
				);

		console.log(raDecDeg);
			
		
	};
	
	


	addEventListeners(){
		if (DEBUG){
			console.log("[FVPresenter::addEventListeners]");
		}

		var handleMouseDown = (event) => {
			this.view.canvas.setPointerCapture(event.pointerId);
			this.mouseDown = true;
			
			this.lastMouseX = event.pageX;
			this.lastMouseY = event.pageY;

			event.preventDefault();
            return false;
		}
		
		var handleMouseUp = (event) => {
			this.view.canvas.releasePointerCapture(event.pointerId);
			this.mouseDown = false;
			document.getElementsByTagName("body")[0].style.cursor = "auto";
			this.lastMouseX = event.clientX;
			this.lastMouseY = event.clientY;
			
			
			var intersectionWithModel = RayPickingUtils.getIntersectionPointWithModel(this.lastMouseX, this.lastMouseY, [global.currentHips]);
			if (intersectionWithModel.intersectionPoint.intersectionPoint === undefined){
				return;
			}
			if (intersectionWithModel.intersectionPoint.intersectionPoint.length > 0){
				
				var phiThetaDeg = cartesianToSpherical(intersectionWithModel.intersectionPoint.intersectionPoint);
				//TODO to be reviewed. cartesianToSpherical seems to convert already Dec into [-90, 90]
				var raDecDeg = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
//				var raDecDeg = {
//						ra: phiThetaDeg.phi,
//						dec: -phiThetaDeg.theta
//						};
				var raHMS = raDegToHMS(raDecDeg.ra);
				var decDMS = decDegToDMS(raDecDeg.dec);
				this.view.setPickedSphericalCoordinates(phiThetaDeg);
				this.view.setPickedAstroCoordinates(raDecDeg, raHMS, decDMS);
				this.view.setPickedObjectName(intersectionWithModel.pickedObject.name);
				
			}else{
				// console.log("no intersection");
			}	
			this.nearestVisibleObjectIdx = intersectionWithModel.idx;

		}
		

		var handleMouseMove = (event) => {
			var newX = event.clientX;
			var newY = event.clientY;

			if (this.mouseDown) {
				
				document.getElementsByTagName("body")[0].style.cursor = "grab";

				var deltaX = (newX - this.lastMouseX)*Math.PI/this.view.canvas.width;
		     	var deltaY = (newY - this.lastMouseY)*Math.PI/this.view.canvas.width;
				
		     	this.inertiaX += 0.1 * deltaX;
				this.inertiaY += 0.1 * deltaY;

				
			}else{
				
				// TODO 
				/**
				 * algo for source picking
				 * do raypicking against the HiPS sphere each draw cycle with mouse coords converted into model coords
				 * pass these coords to the fragment shader (catalogue fragment shader)
				 * In the fragment shader, compute if the segment from mouse coords and source point is less than the point radius (gl_PointSize)
				 * 
				 */
				
				var mousePicker = RayPickingUtils.getIntersectionPointWithSingleModel(newX, newY);
				var mousePoint = mousePicker.intersectionPoint;
				var mouseObjectPicked = mousePicker.pickedObject;
				if (mousePoint !== undefined){
					
					if (mousePoint.length > 0){
						
						// let currP = new Pointing(new Vec3(mousePoint[0], mousePoint[1], mousePoint[2]));

						// for(let i = 0; i < 6; i++){
						// 	let currPixNo = global.getHealpix(i).ang2pix(currP);
						// 	this.view.setHoverIpix(i, currPixNo);
						// }

						var phiThetaDeg = cartesianToSpherical(mousePoint);
						//TODO to be reviewed. cartesianToSpherical seems to convert already Dec into [-90, 90]
						var raDecDeg = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
//						var raDecDeg = {
//								ra: phiThetaDeg.phi,
//								dec: -phiThetaDeg.theta
//								};
						var raHMS = raDegToHMS(raDecDeg.ra);
						var decDMS = decDegToDMS(raDecDeg.dec);
						this.view.setPickedSphericalCoordinates(phiThetaDeg);
						this.view.setPickedAstroCoordinates(raDecDeg, raHMS, decDMS);
						this.view.setPickedObjectName(mouseObjectPicked.name);
						this.mouseCoords = mousePoint;
						
					}else{
						this.mouseCoords = null;
						// console.log("no intersection");
					}	
					
				}
			}

			this.lastMouseX = newX;
			this.lastMouseY = newY;
			event.preventDefault();
		}
		
		
		this.zoomIn = false;
		this.zoomOut = false;
		this.Xrot = 0;
		this.Yrot = 0;
		this.XYrot = [0, 0];
		this.keyPressed = false;
		
		
		var handleKeyUp = (event) => {
			this.keyPressed = false;
			this.zoomIn = false;
			this.zoomOut = false;
			this.Xrot = 0;
			this.Yrot = 0;
			this.XYrot = [0, 0];
			this.keyPressed = false;
		}
		
		var handleKeyPress = (event) => {
			
			var code = event.keyCode;

			var move = vec3.clone([0, 0, 0]);
			var rotStep = 0.01;
			var pan = false;
			switch (code) {
				case 38:// arrowUp
					this.zoomInertia -= 0.001;
					break;
				case 40:// arrowDown
					this.zoomInertia += 0.001;
					break;
				case 87:// W
					this.Xrot = -1;
					break;
				case 88:// X
					this.Xrot = 1;
					break;
				case 68:// A
					this.Yrot = 1;
					break;
				case 65:// D
					this.Yrot = -1;
					break;
				case 81:// Q
					this.XYrot = [-rotStep, -rotStep];
					break;
				case 69:// E
					this.XYrot = [rotStep, -rotStep];
					break;
				case 90:// Z
					this.XYrot = [-rotStep, rotStep];
					break;
				case 67:// C
					this.XYrot = [rotStep, rotStep];
					break;
			}
			this.keyPressed = true;

		}

		var handleMouseWheel = (event) => {
			
			if (event.deltaY < 0) {
				// Zoom in
				this.zoomInertia -= 0.001;
			}
			else {
				// Zoom out
				this.zoomInertia += 0.001;
			  }
		}
		


		window.addEventListener('keydown', handleKeyPress);
		window.addEventListener('keyup', handleKeyUp);
		
		this.view.canvas.onpointerdown = handleMouseDown;
		this.view.canvas.onpointerup = handleMouseUp;
		this.view.canvas.onpointermove = handleMouseMove;
		this.view.canvas.onwheel = handleMouseWheel;
		
	};
	
	getModelCenter(){
		
		
		var rect = this.view.canvas.getBoundingClientRect();
		
		
		let centralCanvasX = (rect.left + this.view.canvas.width)/2;
		let centralCanvasY = (rect.top + this.view.canvas.height)/2;
		
		var intersectionWithModel = RayPickingUtils.getIntersectionPointWithModel(centralCanvasX, centralCanvasY, [global.currentHips]);
		if (intersectionWithModel.intersectionPoint.intersectionPoint === undefined){
			return;
		}
		if (intersectionWithModel.intersectionPoint.intersectionPoint.length > 0){
			
			let phiThetaDeg = cartesianToSpherical(intersectionWithModel.intersectionPoint.intersectionPoint);
			let raDecDeg = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
			let raHMS = raDegToHMS(raDecDeg.ra);
			let decDMS = decDegToDMS(raDecDeg.dec);
			
			console.log(intersectionWithModel.pickedObject.name);
			console.log(phiThetaDeg);
			console.log(raDecDeg);
			
			
		}else{
			// console.log("no intersection");
		}	
		return this.nearestVisibleObjectIdx;
	}
	
	refreshFov(nearestModelIdx){
		if (DEBUG){
			console.log("[FVPresenter::refreshFov]");
		}

		var fovXY =  global.currentHips.refreshFoV();
		return fovXY;
		
	};

	refreshModel(nearestModelIdx, fov, pan){
		if (DEBUG){
			console.log("[FVPresenter::refreshModel]");
		}

		visibleTilesManager.refreshModel(fov)
		global.model = global.currentHips;
		if(USE_OLD_HIPS_JS){
			global.model.refreshModel(fov, pan);
		}
	};

	refreshViewAndModel(pan) {
		this.nearestModel = RayPickingUtils.getNearestObjectOnRay(this.view.canvas.width / 2, this.view.canvas.height / 2, [global.currentHips]);
		this.fovObj = this.refreshFov(this.nearestModel.idx);

		if(this.updateFovTimer == null){
			this.updateFovTimer = setTimeout(()=>this.updateFov(), 100);
		}
		this.refreshModel(this.nearestModel.idx, this.fovObj.minFoV, pan);
	};

	updateFov(){
		this.view.updateFoV(this.fovObj);
		this.updateFovTimer = null;
	}

	draw(){
		this.systemPresenter.refreshModel();
		this.aspectRatio = this.view.canvas.width / this.view.canvas.height;
		
		var THETA, PHI;
		if (this.mouseDown || Math.abs(this.inertiaX) > 0.02 || Math.abs(this.inertiaY) > 0.02) {
//			THETA = 0.9 * this.inertiaY;
//			PHI = 0.9 * this.inertiaX;
			THETA = this.inertiaY;
			PHI = this.inertiaX;
			this.inertiaX *= 0.95;
			this.inertiaY *= 0.95;
			this.camera.rotate(PHI, THETA);
//			this.camera.rotate(degToRad(1), THETA);
			
			this.refreshViewAndModel(true);
		}else{
			this.inertiaY = 0;
			this.inertiaX = 0;
		}
		
		if(Math.abs(this.zoomInertia) > 0.0001){
			this.camera.zoom(this.zoomInertia);
			this.zoomInertia *= 0.95;
			this.refreshViewAndModel(false);
		}

		if(this.keyPressed){
			if (this.Yrot != 0){
				this.camera.rotateY(this.Yrot);
				this.refreshViewAndModel(true);
			}else if (this.Xrot != 0){
				this.camera.rotateX(this.Xrot);
				this.refreshViewAndModel(true);
			}else if(this.XYrot[0] != 0 && this.XYrot[1] != 0){    // ????? it would never enter here!!!!
				this.camera.rotate(this.XYrot[0], this.XYrot[1]);
				this.refreshViewAndModel(true);
			}
		}
		
		this.in_gl.viewport(0, 0, this.in_gl.viewportWidth, this.in_gl.viewportHeight);
		this.in_gl.clear(this.in_gl.COLOR_BUFFER_BIT | this.in_gl.DEPTH_BUFFER_BIT);
		
		let distCamera = -this.camera.getCameraMatrix()[14];
		let r = 1; // Need this to be the radius of the HiPS sphere. Can we get that somewhere?

		//Min value of radius of camera fov or angle from camera to top of sphere
		let alpha = Math.min(this.fovDeg * Math.PI / 180.0, Math.atan2(r,distCamera))
		//Min value of radius of camera fov or angle from camera to side of sphere
		let beta = Math.min(this.fovDeg * Math.PI / 180.0, Math.atan2(r,distCamera))*this.aspectRatio;

		// Solution of the 2nd degree equation on the the angle from the camera to the first intersection of the sphere.
		// Handles to get the corner of the screen in view if close enough
		let a = 1 + Math.pow(Math.tan(alpha) / Math.cos(beta), 2);
		let b = -  distCamera;
		let c = distCamera * distCamera - r * r;

		// The parameters of the standard solution for 2nd degree equation x = p +- SQRT(p^2 - q)
		// Ensure that the values under the sqrt is at least 0
		let p = b / a;
		let q = c / a;
		let s = Math.max(0, p * p  - q);
		let farPlane = - p  - Math.sqrt(s);

		mat4.perspective(this.pMatrix, this.fovDeg , this.aspectRatio, this.nearPlane, farPlane);

		if (global.pMatrix == null){
			global.pMatrix = this.pMatrix;
			this.refreshViewAndModel();
		}
		
		this.hipsListPresenter.draw(this.pMatrix, this.camera.getCameraMatrix());
		let mMatrix = global.currentHips.getModelMatrix();
		if(this.showHealpixGrid){
			this.healpixGrid.draw(this.pMatrix, this.camera.getCameraMatrix(), mMatrix);
		}

		// var mMatrix = this.modelRepo.objModels[0].getModelMatrix();
		
		var k,
		catalogue;
		for (k = 0; k < CatalogueRepo.catalogues.length; k++){
			catalogue = CatalogueRepo.catalogues[k];
			catalogue.draw(mMatrix, this.mouseCoords);
		}
		
		var j,
		footprintSet;
		for (j = 0; j < FootprintsRepo.footprints.length; j++){
			footprintSet = FootprintsRepo.footprints[j];
			footprintSet.draw(mMatrix, this.mouseCoords);
		}
		
//		this.xyzRefSystemObj.draw(this.pMatrix, this.camera.getCameraMatrix());
	};
}

export default FVPresenter2;