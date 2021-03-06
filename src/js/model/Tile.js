"use strict";

import global from '../Global';
import {tileBufferSingleton} from './TileBuffer';
import {healpixShader} from './HealpixShader';
import FITSOnTheWeb from 'fitsontheweb';
import { mat4 } from 'gl-matrix';

class Tile {

	constructor(order, ipix, format, url) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		this.key = order + "/" + ipix + "/" + format + "/" + url;
		this.url = url;
		this.radius = 1;
		this.useMipmap = false;
		this.setStep();
		this.drawsPerTexture = this.step * this.step / 4 * 3 * 2;

		this.xyf = global.getHealpix(order).nest2xyf(ipix);

		this.imageLoaded = false;
		this.textureLoaded = false;
		this.isDownloading = false;
		this._isInView = false;
		this.vertexPositionIndex = 0;

		this.format = format != undefined ? format : "png";
		
		this.children = new Set();

		this.initImage();
	}

	setStep(){
		switch (this.order){
			case 0:
			case 1:
			case 2:
			case 3:
				this.step = 16;
				break;
			case 4:
				this.step = 8;
				break;
			case 5:
				this.step = 4;
				break;
			default:
				this.step = 2;
				break;
		}
	}

	initImage () {
		this.image = new Image();
		let dirNumber = Math.floor(this.ipix / 10000) * 10000;

		if(this.format !== 'fits'){
			this.image.onload = ()=> {
				this.onLoad();
			}
			this.image.onerror = ()=> {
				if(!this.canceledDownload){
					this.imageLoadFailed = true;
					this.isDownloading = false;
				}
			}
		}
		
		//TODO remove cross origin attribute for maps on the same domain as it slightly degrades loading time
		this.image.setAttribute('crossorigin', 'anonymous');
		this.imageUrl = this.url + "Norder" + this.order + "/Dir" + dirNumber + "/Npix" + this.ipix + "." + this.format;
	}
	
	onLoad(){
		if(!this.canceledDownload){
			this.imageLoaded = true;
			this.isDownloading = false;
			this.createTexture();
			this.setupBuffers();
		}
	}

	createTexture(){
		this.texture = this.gl.createTexture();
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		if(this.useMipmap){
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);// 4 times per pixel
			// this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);// 8 times per pixel
		} else {
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		}
	}

	setupBuffers(){
		this.setupVertexPositionBuffer();
		this.vertexIndexBuffers = [];
		this.setupIndexBufferForQuadrant(0, 0);
		this.setupIndexBufferForQuadrant(0, 1);
		this.setupIndexBufferForQuadrant(1, 1);
		this.setupIndexBufferForQuadrant(1, 0);

		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
		if(this.useMipmap){
			this.gl.generateMipmap(this.gl.TEXTURE_2D);
		}
		
		this.anythingToRender = true;
		this.textureLoaded = true;
	}

	setupVertexPositionBuffer () {
		this.vertexPosition = new Float32Array(5 * (this.step + 1) * (this.step + 1));
		this.vertexPositionBuffer = this.gl.createBuffer();
		this.populateVertexList(this.step);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);
	}

	setupIndexBufferForQuadrant(x, y){
		let index = 0;
		let indexArray = new Uint16Array(3 * this.step * this.step / 2);
		for (let i = x * this.step / 2; i < (this.step / 2) * (x + 1); i++){
			for (let j = y * this.step / 2; j < (this.step / 2) * (y + 1); j++){
				indexArray[index++] = i * (this.step + 1) + j;
				indexArray[index++] = 1 + i * (this.step + 1) + j;
				indexArray[index++] = this.step + 1 + i * (this.step + 1) + j;
				indexArray[index++] = 1 + i * (this.step + 1) + j;
				indexArray[index++] = this.step + 1 + i * (this.step + 1) + j;
				indexArray[index++] = this.step + 2 + i * (this.step + 1) + j;
			}
		}

		let quadrant = x * 2 + y;
		this.vertexIndexBuffers[quadrant] = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffers[quadrant]);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.STATIC_DRAW);
	}
	
	/*
	* Vertices distributed in a grid pattern like the example below
	* Example for pattern with step set to 4
	*            24
	*          19  23
	*       14   18  22
	*      9   13  17  21
	*    4   8   12  16  20
	*      3   7   11  15
	*        2   6   10
	*          1   5
	*            0
	* 
	*/
	populateVertexList(step){
		for (let y = 0; y < step; y += 2){
			for (let x = 0; x < step; x += 2){
				let points = this.getPointsForXyf(x, y, step);

				this.addVertexPosition(points[2], (1 / step) * y, (1 / step) * x, y * (step + 1) + x);
				this.addVertexPosition(points[3], (1 / step) * y, (1 / step) + (1 / step) * x, y * (step + 1) + x + 1);
				this.addVertexPosition(points[1], (1 / step) + (1 / step) * y, (1 / step) * x, (y + 1) * (step + 1) + x);
				this.addVertexPosition(points[0], (1 / step) + (1 / step) * y, (1 / step) + (1 / step) * x, (y + 1) * (step + 1) + x + 1);
				if (x + 2 >= step && step > 1){
					x = step - 1;
					points = this.getPointsForXyf(x, y, step);
					this.addVertexPosition(points[3], (1 / step) * y, (1 / step) + (1 / step) * x, y * (step + 1) + step);
					this.addVertexPosition(points[0], (1 / step) + (1 / step) * y, (1 / step) + (1 / step) * x, (y + 1) * (step + 1) + step);
				}
			}
		}
		if (step > 1){
			this.vertexOfLastRow(step);
		}
	}

	vertexOfLastRow(step) {
		let y = step - 1;

		for (let x = 0; x < step; x += 2){
			let points = this.getPointsForXyf(x, y, step);
			this.addVertexPosition(points[1], (1 / step) + (1 / step) * y, (1 / step) * x, (y + 1) * (step + 1) + x);
			this.addVertexPosition(points[0], (1 / step) + (1 / step) * y, (1 / step) + (1 / step) * x, (y + 1) * (step + 1) + x + 1);
			if (x + 2 >= step){
				x = step - 1;
				points = this.getPointsForXyf(x, y, step);
				this.addVertexPosition(points[0], (1 / step) + (1 / step) * y, (1 / step) + (1 / step) * x, (y + 1) * (step + 1) + step);
			}
		}
	}

	getPointsForXyf(x, y, step){
		return global.getHealpix(this.order).getPointsForXyf(x + this.xyf.ix * step, y + this.xyf.iy * step, step, this.xyf.face);
	}

	addVertexPosition(position, u , v, index) {
		index *= 5;
		this.vertexPosition[index++] = position.x;
		this.vertexPosition[index++] = position.y;
		this.vertexPosition[index++] = position.z;
		this.vertexPosition[index++] = u;
		this.vertexPosition[index++] = v;
	}

	startLoadingImage(){
		if(this.isDownloading || this.imageLoadFailed){
			return;
		}
		this.isDownloading = true;
		this.canceledDownload = false;

		if(this.format == 'fits'){
			if(this.fitsReader == null){
				this.fitsReader = new FITSOnTheWeb(this.imageUrl, "grayscale", "linear", -0.0966, 20.461, currimg => {
				// this.fitsReader = new FITSOnTheWeb(this.imageUrl, "grayscale", "linear", Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, currimg => {
					this.image = currimg;
					this.image.onload = () => {
						this.onLoad();
					}
					this.image.onerror = ()=> {
						if(!this.canceledDownload){
							this.imageLoadFailed = true;
							this.isDownloading = false;
						}
						
					}
				});
			}
			this.fitsReader.start();
		} else {
			this.image.src = this.imageUrl;
		}
	}

	stopLoadingImage(){
		if(!this.imageLoaded){
			this.isDownloading = false;
			this.canceledDownload = true;
			this.image.src = "";

			if(this.fitsReader){
				this.fitsReader.stop();
			}
		}
	}

	isInView(){
		return this._isInView;
	}

	addToView(){
		if(this._isInView) {return}
		let parent = this.getParent();
		this._isInView = true;
		if(parent){
			parent.addToView();
		}

		if(this.imageLoaded && !this.textureLoaded){
			this.setupBuffers();
		}
	}

	removeFromView(){
		tileBufferSingleton.tileRemovedFromView(this);
		if(!this._isInView) {return}
		this._isInView = false;

		this.stopLoadingImage();
		let parent = this.getParent();
		if(parent){
			parent.childRemovedFromView();
		}
		this.getExistingChildren().forEach(child => {
			child.removeFromView();
		});
	}

	childRemovedFromView(){
		let numberOfVisibleChildren = 0;
		this.getExistingChildren().forEach(child => {
			if(child.isInView()){ 
				numberOfVisibleChildren++;
			}
		});

		if((numberOfVisibleChildren == 0 && this.order != 0)){
			this.removeFromView();
		} else{
			this.addToView();
		}
	}

	getParent(){
		if(this.order > 0){
			return tileBufferSingleton.getTile(this.order - 1, (this.ipix >> 2), this.format, this.url);
		}
	}

	getExistingChildren(){
		let children = [];
		for(let i = 0; i < 4; i++){
			let child = tileBufferSingleton.getIfAlreadyExist(this.order + 1, (this.ipix << 2) + i, this.format, this.url);
			if(child){
				children.push(child);
			}
		}
		return children;
	}

	getChildren(){
		if(this.children.size != 4){
			this.children = new Set();
			for(let i = 0; i < 4; i++){
				let child = tileBufferSingleton.getTile(this.order + 1, (this.ipix << 2) + i, this.format, this.url);
					this.children.add(child);
			}
		}
		return this.children;
	}

	draw(pMatrix, vMatrix, modelMatrix, opacity){
		this.age = 0;
		if(this.isInView() && !this.imageLoaded){
			this.startLoadingImage();
		}
		if(this.anythingToRender){
			let quadrantsToDraw = this.drawChildren(pMatrix, vMatrix, modelMatrix, opacity);
			healpixShader.useShader(pMatrix, vMatrix, modelMatrix, opacity);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
			healpixShader.setPositionTextureBuffer(this.vertexPositionBuffer);
			quadrantsToDraw.forEach((quadrant) => {
				healpixShader.setIndexBuffer(this.vertexIndexBuffers[quadrant]);
				this.gl.drawElements(this.gl.TRIANGLES, this.drawsPerTexture, this.gl.UNSIGNED_SHORT, 0);
			})
			return true; //Completed draw
		}
		return false;
	}
	
	drawChildren(pMatrix, vMatrix, modelMatrix, opacity) {
		let quadrantsToDraw = new Set([0, 1, 2, 3]);
		if (global.order > this.order) {
			this.getChildren().forEach((child) => {
				if(!child || child.isDestructed){ //Child deleted, need to refresh child cache
					this.children.clear();
					return this.drawChildren(pMatrix, vMatrix, modelMatrix, opacity);
				}
				if (child.isInView()) {
					if(child.draw(pMatrix, vMatrix, modelMatrix, opacity)){
						quadrantsToDraw.delete(child.ipix - (this.ipix << 2));
					}
				}
			}
			);
		}
		return quadrantsToDraw;
	}

	parentDestructed(){
		this.parent = null;
		this.removeFromView();
	}


	destruct(){
		this.getExistingChildren().forEach(child => {
			child.parentDestructed();
		});

		this.isDestructed = true;
		this.children = null;
		
		this.gl.deleteTexture(this.texture);
		this.gl.deleteBuffer(this.vertexPositionBuffer);
		
		if(this.vertexIndexBuffers){
			this.vertexIndexBuffers.forEach((buffer)=>{
				this.gl.deleteBuffer(buffer);
			});
		}

		this.image = null;
		this.imageLoaded = false;
		this.textureLoaded = false;
		
		this.fitsReader = null;
		this.vertexPosition = null;
	}
}
export default Tile;