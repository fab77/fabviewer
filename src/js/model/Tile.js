"use strict";

import global from '../Global';
import {tileBufferSingleton} from './TileBuffer';
import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';
import {healpixGridTileDrawerSingleton} from './HealpixGridTileDrawer';
import {tileDrawerSingleton} from './TileDrawer';
import FITSOnTheWeb from 'fitsontheweb';

class Tile {

	constructor(order, ipix, format, url) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		this.key = order + "/" + ipix + "/" + format + "/" + url;
		this.url = url;
		this.radius = 1;
		this.useMipmap = true;

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
		this.textureCoordinates = new Float32Array(2 * 25);
		this.vertexIndices = new Uint16Array(3 * 2 * 16);
		this.vertexPosition = new Float32Array(25 * 3);
		this.vertexPositionBuffer = this.gl.createBuffer();
		this.vertexTextureCoordBuffer = this.gl.createBuffer();
		this.vertexIndexBuffer = this.gl.createBuffer();
		
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
		
		//TODO remove cross origin attribute for maps on the same domain as it slightly degrades loading time
		this.image.setAttribute('crossorigin', 'anonymous');
		this.imageUrl = this.url + "Norder" + this.order + "/Dir" + dirNumber + "/Npix" + this.ipix + "." + this.format;
	}
	
	onLoad(){
		this.imageLoaded = true;
		this.createTexture();
		this.tileLoaded();	
		let parent = this.getParent();
		if(parent){
			parent.childReady();
		}
	}

	tileLoaded(){
		this.addTile();
	}

	startLoadingImage(){
		if(this.format == 'fits'){
			if(this.fitsReader == null){
				this.fitsReader = new FITSOnTheWeb(this.imageUrl, "grayscale", "linear", 0.0966, 2.461, currimg => {
					this.image = currimg;
					this.image.onload = () => {
						this.onLoad();
					}
				});
			}
			this.fitsReader.start();
		} else {
			this.image.src = this.imageUrl;
		}
	}

	stopLoadingImage(){
		this.image.src = "";
		if(this.format == 'fits'){
			this.fitsReader.stop();
		}
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
		healpixGridTileDrawerSingleton.add(healpixGridTileBufferSingleton.getTile(this.order, this.ipix));

		if(!this.imageLoaded){
			this.startLoadingImage();
		} else if(!this.textureLoaded){
			this.tileLoaded(tile);
		} else {
			//Still in buffer
			if(DEBUG){
				console.log("Tile not fully removed yet");
			}
		}
		
	}

	removeFromView(){
		if(!this._isInView) {return}
		this._isInView = false;

		this.remove();
		healpixGridTileDrawerSingleton.remove(healpixGridTileBufferSingleton.getTile(this.order, this.ipix));
		let parent = this.getParent();
		if(parent){
			parent.childRemovedFromView();
		}
	}

	remove(){
		if(!this.imageLoaded){
			this.stopLoadingImage();
		}
		//TODO tell TileBuffer that this tile may be deleted if needed
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
		this.remove();
		healpixGridTileDrawerSingleton.remove(healpixGridTileBufferSingleton.getTile(this.order, this.ipix));
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
			this.parent = tileBufferSingleton.getIfAlreadyExist(this.order - 1, Math.floor(this.ipix / 4), this.format, this.url);
		}
		return this.parent;
	}

	getExistingChildren(){
		let children = [];
		for(let i = 0; i < 4; i++){
			let child = tileBufferSingleton.getIfAlreadyExist(this.order + 1, this.ipix * 4 + i, this.format, this.url);
			if(child){
				children.push(child);
			}
		}
		return children;
	}

	getChildren(){
		let children = [];
		for(let i = 0; i < 4; i++){
			let child = tileBufferSingleton.getTile(this.order + 1, this.ipix * 4 + i, this.format, this.url);
			if(child){
				children.push(child);
			}
		}
		return children;
	}

	createTexture(){
		this.texture = this.gl.createTexture();
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		if(this.useMipmap){
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);// 4 times per pixel
			// this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);// 8 times per pixel
		} else {
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			// this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		}
	}


    addTile(){
        let tileTextureCoordinates = new Float32Array(25*2);
        let index = 0;

        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 0.50;
        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 1.00;

        //5
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 0.50;
        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 1.00;

        //8
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 1.00;
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 0.50;

        //11
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 0.50;
        tileTextureCoordinates[index++] = 0.00;
        //15
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 0.00;
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 0.50;
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 0.75;
        
        //19
        tileTextureCoordinates[index++] = 0.50;
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.75;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.50;
        //22
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.50;
        tileTextureCoordinates[index++] = 0.25;
        tileTextureCoordinates[index++] = 0.50;
        tileTextureCoordinates[index++] = 0.50;


        let tileVertexIndices = new Uint16Array(6*16);
        let baseFaceIndex = 0;
        this.setVertexIndiciesFor25Points(tileVertexIndices, baseFaceIndex);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
        if(this.useMipmap){
            this.updateMipmapAndWriteToBuffer(tileTextureCoordinates, tileVertexIndices);
        } else {
            this.writeToBuffer(tileTextureCoordinates, tileVertexIndices);
        }

        this.textureLoaded = true;
	}
	
	updateMipmapAndWriteToBuffer(tileTextureCoordinates, tileVertexIndices){
        if(DEBUG){
            console.log("mipmap Update - Batch: " + this.batchIndex);
        }
        this.gl.activeTexture(this.gl.TEXTURE0);
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        this.writeToBuffer(tileTextureCoordinates, tileVertexIndices);

        this.anythingToRender = true;
	}
	
	writeToBuffer(tileTextureCoordinates, tileVertexIndices) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = this.vertexPosition.length;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, tileTextureCoordinates, this.gl.STATIC_DRAW);
        this.vertexTextureCoordBuffer.itemSize = 2;
        this.vertexTextureCoordBuffer.numItems = tileTextureCoordinates.length;

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, tileVertexIndices, this.gl.STATIC_DRAW);
        this.vertexIndexBuffer.itemSize = 1;
        this.vertexIndexBuffer.numItems = tileVertexIndices.length;

        this.anythingToRender = true;
    }

    setVertexIndiciesFor25Points(tileVertexIndices, baseFaceIndex){
        this.nextTileVertexIndexPosition = 0;

        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 0, baseFaceIndex + 1, baseFaceIndex + 16, baseFaceIndex + 15);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 1, baseFaceIndex + 2, baseFaceIndex + 17, baseFaceIndex + 16);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 2, baseFaceIndex + 3, baseFaceIndex + 18, baseFaceIndex + 17);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 3, baseFaceIndex + 4, baseFaceIndex + 5, baseFaceIndex + 18);

        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 15, baseFaceIndex + 16, baseFaceIndex + 23, baseFaceIndex + 14);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 16, baseFaceIndex + 17, baseFaceIndex + 24, baseFaceIndex + 23);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 17, baseFaceIndex + 18, baseFaceIndex + 19, baseFaceIndex + 24);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 18, baseFaceIndex + 5, baseFaceIndex + 6, baseFaceIndex + 19);
        
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 14, baseFaceIndex + 23, baseFaceIndex + 22, baseFaceIndex + 13);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 23, baseFaceIndex + 24, baseFaceIndex + 21, baseFaceIndex + 22);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 24, baseFaceIndex + 19, baseFaceIndex + 20, baseFaceIndex + 21);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 19, baseFaceIndex + 6, baseFaceIndex + 7, baseFaceIndex + 20);
        
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 13, baseFaceIndex + 22, baseFaceIndex + 11, baseFaceIndex + 12);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 22, baseFaceIndex + 21, baseFaceIndex + 10, baseFaceIndex + 11);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 21, baseFaceIndex + 20, baseFaceIndex + 9, baseFaceIndex + 10);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 20, baseFaceIndex + 7, baseFaceIndex + 8, baseFaceIndex + 9);
    }

    setVertexIndexFor4Points(tileVertexIndices, point0, point1, point2, point3){
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point0;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point1;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point2;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point0;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point2;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point3;
    }

	draw(pMatrix, vMatrix, modelMatrix){
		if(!this.anythingToRender){return;}
		
		if(global.order > this.order){
			this.getChildren().forEach((child) =>{
				if(child.imageLoaded && child.isInView()
				){
					child.draw(pMatrix, vMatrix, modelMatrix)
				}
			});
		}
		tileDrawerSingleton.useShader(pMatrix, vMatrix, modelMatrix);
		tileDrawerSingleton.setBuffers(this.vertexPositionBuffer, this.vertexTextureCoordBuffer, this.vertexIndexBuffer);
		
		let drawsPerTexture = 16 * 6;
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

		//TODO quadrants - Don't draw quadrants where child is already drawn
		this.gl.drawElements(this.gl.TRIANGLES, drawsPerTexture, this.gl.UNSIGNED_SHORT, 0);
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
		

		this.image = null;
		this.imageLoaded = false;
		this.textureLoaded = false;

		this.fitsReader = null;
		this.parent = null;
		this.vertexPosition = null;

		tileBufferSingleton.removeTile(this.key);
	}
}
export default Tile;