"use strict";

import global from '../Global';
import {tileBufferSingleton} from './TileBuffer';
import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';
import {healpixGridTileDrawerSingleton} from './HealpixGridTileDrawer';
import {tileDrawerSingleton} from './TileDrawer';

class Tile {

	constructor(order, ipix, radius) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		this.key = order + "/" + ipix;
		this.radius = radius != undefined ? radius : 1;

		this.imageLoaded = false;
		this.textureLoaded = false;
		this._isInView = false;
		this.numberOfVisibleChildrenReadyToDraw = 0;

		this.initBuffer();
		this.initImage();

		this.getExistingChildren().forEach((child) =>{
			if(child.imageLoaded){
				this.numberOfVisibleChildrenReadyToDraw++;
			}
		});
	}

	initBuffer () {
		this.vertexPosition = new Float32Array(12);
		let facesVec3Array = global.getHealpix(this.order).getBoundaries(this.ipix);
		if (this.radius != 1){
			// HiPS radius different from Healpix default radius 1.
			// Mapping HEALPix coordinates to the new sphere and radius
			let theta0, theta1, theta2, theta3;
			let phi0, phi1, phi2, phi3;
			theta0 = Math.acos(facesVec3Array[0].z);
			theta1 = Math.acos(facesVec3Array[1].z);
			theta2 = Math.acos(facesVec3Array[2].z);
			theta3 = Math.acos(facesVec3Array[3].z);

			phi0 = Math.atan2(facesVec3Array[0].y, facesVec3Array[0].x);
			phi1 = Math.atan2(facesVec3Array[1].y, facesVec3Array[1].x);
			phi2 = Math.atan2(facesVec3Array[2].y, facesVec3Array[2].x);
			phi3 = Math.atan2(facesVec3Array[3].y, facesVec3Array[3].x);

			this.vertexPosition[0] = -this.radius * Math.sin(theta0) * Math.cos(phi0);
			this.vertexPosition[1] = this.radius * Math.sin(theta0) * Math.sin(phi0);
			this.vertexPosition[2] = this.radius * Math.cos(theta0);

			this.vertexPosition[3] = -this.radius * Math.sin(theta1) * Math.cos(phi1);
			this.vertexPosition[4] = this.radius * Math.sin(theta1) * Math.sin(phi1);
			this.vertexPosition[5] = this.radius * Math.cos(theta1);

			this.vertexPosition[6] = -this.radius * Math.sin(theta2) * Math.cos(phi2);
			this.vertexPosition[7] = this.radius * Math.sin(theta2) * Math.sin(phi2);
			this.vertexPosition[8] = this.radius * Math.cos(theta2);

			this.vertexPosition[9] = -this.radius * Math.sin(theta3) * Math.cos(phi3);
			this.vertexPosition[10] = this.radius * Math.sin(theta3) * Math.sin(phi3);
			this.vertexPosition[11] = this.radius * Math.cos(theta3);
		} else{
			this.vertexPosition[0] = facesVec3Array[0].x ;
			this.vertexPosition[1] = facesVec3Array[0].y ;
			this.vertexPosition[2] = facesVec3Array[0].z;

			this.vertexPosition[3] = facesVec3Array[1].x;
			this.vertexPosition[4] = facesVec3Array[1].y;
			this.vertexPosition[5] = facesVec3Array[1].z;

			this.vertexPosition[6] = facesVec3Array[2].x;
			this.vertexPosition[7] = facesVec3Array[2].y;
			this.vertexPosition[8] = facesVec3Array[2].z;

			this.vertexPosition[9] = facesVec3Array[3].x;
			this.vertexPosition[10] = facesVec3Array[3].y;
			this.vertexPosition[11] = facesVec3Array[3].z;
		}
	}

	initImage () {
		this.image = new Image();
		var dirNumber = Math.floor(this.ipix / 10000) * 10000;

		this.addOnLoad();
		
		let fileFormat = this.fitsEnabled ? ".fits" : ".jpg"
		//TODO remove cross origin attribute for maps on the same domain as it slightly degrades loading time
		this.image.setAttribute('crossorigin', 'anonymous');
		this.imageUrl = "https://skies.esac.esa.int/DSSColor/Norder"+this.order+"/Dir"+dirNumber+"/Npix"+this.ipix+fileFormat;
	}
	
	addOnLoad(){
		this.image.onload = ()=> {
			this.imageLoaded = true;
			tileDrawerSingleton.tileLoaded(this);	
			let parent = this.getParent();
			if(parent){
				parent.childReady();
			}
		};
	}

	startLoadingImage(){
		if(this.fitsEnabled){
			new FabFitsReader(this.imageUrl, "grayscale", "linear", 0.0966, 2.461, function (img){
				this.image = img;
				this.imageLoaded = true;
				this.handleLoadedTexture(0);
			});
		} else {
			this.image.src = this.imageUrl;
		}
	}

	stopLoadingImage(){
		this.image.src = "";
	}

	isInView(){
		return this._isInView;
	}

	addToView(){
		if(this._isInView) {return}
		this._isInView = true;
		let parent = this.getParent();
		if(parent){
			parent.childAddedToView();
		}
		tileDrawerSingleton.add(this);
		healpixGridTileDrawerSingleton.add(healpixGridTileBufferSingleton.getTile(this.order, this.ipix));
	}

	removeFromView(){
		if(!this._isInView) {return}
		this._isInView = false;

		tileDrawerSingleton.remove(this);
		let parent = this.getParent();
		if(parent){
			parent.childRemovedFromView();
		}
	}

	childReady(){
		this.numberOfVisibleChildrenReadyToDraw++;
		if(this.numberOfVisibleChildrenReadyToDraw == 4 && global.order > this.order){
			this.removeFromDrawAsChildrenAreReady();
		}
	}

	removeFromDrawAsChildrenAreReady(){
		tileDrawerSingleton.remove(this);
		let parent = this.getParent();
		if(parent){
			parent.childRemovedSinceItsChildrenDrawnInstead();
		}
	}

	childRemovedSinceItsChildrenDrawnInstead(){
		let drawnChildren = 0;
		this.getExistingChildren().forEach(child => {
			if((child._isInView && child.imageLoaded && global.order > this.order) 
				|| (child.childrenReady && global.order > child.order) 
				){
					drawnChildren++;
			}
			if(drawnChildren == 4){
				this.removeFromDrawAsChildrenAreReady();
			}
		});
	}

	childAddedToView(){
		let numberOfVisibleChildren = 0;
		let numberOfChildrenInViewWithLoadedTextures = 0;
		this.getExistingChildren().forEach(child => {
			if(child.isInView()){ 
				numberOfVisibleChildren++;
			}
			if(child.isInView() && child.imageLoaded){ 
				numberOfChildrenInViewWithLoadedTextures++;
			}
		});

		if(numberOfChildrenInViewWithLoadedTextures == numberOfVisibleChildren
			&& global.order > this.order){
				this.removeFromDrawAsChildrenAreReady();
		} else {
			this.addToView();
		}
	}

	childRemovedFromView(){
		let numberOfVisibleChildren = 0;
		let numberOfChildrenInViewWithLoadedTextures = 0;
		this.getExistingChildren().forEach(child => {
			if(child.isInView()){ 
				numberOfVisibleChildren++;
			}
			if(child.isInView() && child.imageLoaded){ 
				numberOfChildrenInViewWithLoadedTextures++;
			}
		});

		if((numberOfVisibleChildren == 0)){
			this.removeFromView();
		} else if(numberOfChildrenInViewWithLoadedTextures == numberOfVisibleChildren
				&& global.order > this.order) {
		} else{
			this.addToView();
		}
	}

	getParent(){
		if(this.parent == null && this.order > 0){
			this.parent = tileBufferSingleton.getIfAlreadyExist(this.order - 1, Math.floor(this.ipix / 4));
		}
		return this.parent;
	}

	getExistingChildren(){
		let children = [];
		for(let i = 0; i < 4; i++){
			let child = tileBufferSingleton.getIfAlreadyExist(this.order + 1, this.ipix * 4 + i);
			if(child){
				children.push(child);
			}
		}
		return children;
	}

	parentDestructed(){
		this.parent = null;
	}

	childDestructed(child){
		if(child.textureLoaded){
			this.numberOfVisibleChildrenReadyToDraw--;
		}
	}

	destruct(){
		if(this.parent != null){
			this.parent.childDestructed(this);
		}
		this.getExistingChildren().forEach(child => {
			child.parentDestructed();
		});
		healpixGridTileDrawerSingleton.remove(healpixGridTileBufferSingleton.getTile(this.order, this.ipix));

		this.image = null;
		this.imageLoaded = false;
		this.textureLoaded = false;

		this.parent = null;
		this.vertexPosition = null;

		tileBufferSingleton.removeTile(this.order, this.ipix);
	}
}
export default Tile;