"use strict";

import global from '../Global';
import {tileBufferSingleton} from './TileBuffer';
import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';
import {healpixGridTileDrawerSingleton} from './HealpixGridTileDrawer';
import {tileDrawerSingleton} from './TileDrawer';
import FITSOnTheWeb from 'fitsontheweb';

class Tile {

	constructor(order, ipix, format) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		this.key = order + "/" + ipix + "/" + format;
//		this.radius = radius != undefined ? radius : 1;
		this.radius = 1;
		
		this.imageLoaded = false;
		this.textureLoaded = false;
		this._isInView = false;
		this.numberOfVisibleChildrenReadyToDraw = 0;
		this.vertexPositionIndex = 0;

		this.format = format != undefined ? format : "png";
		
		this.initBuffer();
		this.initImage();

		this.getExistingChildren().forEach((child) =>{
			if(child.imageLoaded){
				this.numberOfVisibleChildrenReadyToDraw++;
			}
		});
		

	}

	initBuffer () {
		this.vertexPosition = new Float32Array(25 * 3);
		
		global.getHealpix(this.order).get25Points(this.ipix).forEach(position => {
			this.addVertexPosition(position);
		});
	}

	addVertexPosition(position) {
		this.vertexPosition[this.vertexPositionIndex++] = position.x;
		this.vertexPosition[this.vertexPositionIndex++] = position.y;
		this.vertexPosition[this.vertexPositionIndex++] = position.z;
	}

	initImage () {
		this.image = new Image();
		var dirNumber = Math.floor(this.ipix / 10000) * 10000;

		if(this.format !== 'fits'){
			this.image.onload = ()=> {
				this.onLoad();
			}
		}
		
//		let fileFormat = this.fitsEnabled ? ".fits" : ".jpg"
		//TODO remove cross origin attribute for maps on the same domain as it slightly degrades loading time
		this.image.setAttribute('crossorigin', 'anonymous');
		
		
		
		
//		this.imageUrl = "https://skies.esac.esa.int/DSSColor/Norder"+this.order+"/Dir"+dirNumber+"/Npix"+this.ipix+"."+this.format;
		this.imageUrl = "http://skies.esac.esa.int//Herschel/normalized/hips250_pnorm_allsky/Norder"+this.order+"/Dir"+dirNumber+"/Npix"+this.ipix+"."+this.format;
	}
	
	onLoad(){
		this.imageLoaded = true;
		tileDrawerSingleton.tileLoaded(this);	
		let parent = this.getParent();
		if(parent){
			parent.childReady();
		}
	}

	startLoadingImage(){
		if(this.format == 'fits'){
			new FITSOnTheWeb(this.imageUrl, "grayscale", "linear", 0.0966, 2.461, currimg => {
				this.image = currimg;
				this.image.onload = () => {
					this.onLoad();
				}
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
		if(this.order == 0){
			return;
		}
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

		if((numberOfVisibleChildren == 0 && this.order != 0)){
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