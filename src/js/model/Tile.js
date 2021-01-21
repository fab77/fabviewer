"use strict";

import global from '../Global';
import {tileBufferSingleton} from './TileBuffer';
import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';
import {healpixGridTileDrawerSingleton} from './HealpixGridTileDrawer';
import {healpixShader} from './HealpixShader';
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
		this.isDownloading = false;
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
		this.vertexPosition = new Float32Array(25 * 3 + 2 * 25);
		this.vertexPositionBuffer = this.gl.createBuffer();
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


		global.getHealpix(this.order).get25Points(this.ipix).forEach((position, i) => {
			this.addVertexPosition(position, tileTextureCoordinates, i);
		});
	}

	addVertexPosition(position, tileTextureCoordinates, i) {
		this.vertexPosition[this.vertexPositionIndex++] = position.x;
		this.vertexPosition[this.vertexPositionIndex++] = position.y;
		this.vertexPosition[this.vertexPositionIndex++] = position.z;
		this.vertexPosition[this.vertexPositionIndex++] = tileTextureCoordinates[i * 2];
		this.vertexPosition[this.vertexPositionIndex++] = tileTextureCoordinates[i * 2 + 1];
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
		this.isDownloading = false;
		this.createTexture();
		this.addTile();
	}

	startLoadingImage(){
		if(this.isDownloading){
			return;
		}
		this.isDownloading = true;
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
		if(!this.imageLoaded){
			this.image.src = "";
			this.isDownloading = false;
			if(this.format == 'fits'){
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
		healpixGridTileDrawerSingleton.add(healpixGridTileBufferSingleton.getTile(this.order, this.ipix));

		if(this.imageLoaded && !this.textureLoaded){
			this.addTile();
		}
	}

	removeFromView(){
		if(!this._isInView) {return}
		this._isInView = false;

		this.stopLoadingImage();
		tileBufferSingleton.tileRemovedFromView(this.key);
		healpixGridTileDrawerSingleton.remove(healpixGridTileBufferSingleton.getTile(this.order, this.ipix));
		let parent = this.getParent();
		if(parent){
			parent.childRemovedFromView();
		}
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
		if(this.parent == null && this.order > 0){
			this.parent = tileBufferSingleton.getTile(this.order - 1, Math.floor(this.ipix / 4), this.format, this.url);
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
		let tileVertexIndices = [];
		tileVertexIndices[0] = new Uint16Array(3 * 2 * 4);
		tileVertexIndices[1] = new Uint16Array(3 * 2 * 4);
		tileVertexIndices[2] = new Uint16Array(3 * 2 * 4);
		tileVertexIndices[3] = new Uint16Array(3 * 2 * 4);
		this.vertexIndexBuffers = [];
		this.vertexIndexBuffers[0] = this.gl.createBuffer();
		this.vertexIndexBuffers[1] = this.gl.createBuffer();
		this.vertexIndexBuffers[2] = this.gl.createBuffer();
		this.vertexIndexBuffers[3] = this.gl.createBuffer();
        let baseFaceIndex = 0;

		this.nextTileVertexIndexPosition = 0;

        this.setVertexIndexFor4Points(tileVertexIndices[3],
            baseFaceIndex + 0, baseFaceIndex + 1, baseFaceIndex + 16, baseFaceIndex + 15);
        this.setVertexIndexFor4Points(tileVertexIndices[3],
			baseFaceIndex + 1, baseFaceIndex + 2, baseFaceIndex + 17, baseFaceIndex + 16);
		this.setVertexIndexFor4Points(tileVertexIndices[3],
			baseFaceIndex + 15, baseFaceIndex + 16, baseFaceIndex + 23, baseFaceIndex + 14);
		this.setVertexIndexFor4Points(tileVertexIndices[3],
			baseFaceIndex + 16, baseFaceIndex + 17, baseFaceIndex + 24, baseFaceIndex + 23);
		this.nextTileVertexIndexPosition = 0;
			
        this.setVertexIndexFor4Points(tileVertexIndices[2],
            baseFaceIndex + 2, baseFaceIndex + 3, baseFaceIndex + 18, baseFaceIndex + 17);
        this.setVertexIndexFor4Points(tileVertexIndices[2],
            baseFaceIndex + 3, baseFaceIndex + 4, baseFaceIndex + 5, baseFaceIndex + 18);
        this.setVertexIndexFor4Points(tileVertexIndices[2],
            baseFaceIndex + 17, baseFaceIndex + 18, baseFaceIndex + 19, baseFaceIndex + 24);
        this.setVertexIndexFor4Points(tileVertexIndices[2],
            baseFaceIndex + 18, baseFaceIndex + 5, baseFaceIndex + 6, baseFaceIndex + 19);
		this.nextTileVertexIndexPosition = 0;
        
        this.setVertexIndexFor4Points(tileVertexIndices[1],
            baseFaceIndex + 14, baseFaceIndex + 23, baseFaceIndex + 22, baseFaceIndex + 13);
        this.setVertexIndexFor4Points(tileVertexIndices[1],
            baseFaceIndex + 23, baseFaceIndex + 24, baseFaceIndex + 21, baseFaceIndex + 22);
		this.setVertexIndexFor4Points(tileVertexIndices[1],
			baseFaceIndex + 13, baseFaceIndex + 22, baseFaceIndex + 11, baseFaceIndex + 12);
		this.setVertexIndexFor4Points(tileVertexIndices[1],
			baseFaceIndex + 22, baseFaceIndex + 21, baseFaceIndex + 10, baseFaceIndex + 11);
		this.nextTileVertexIndexPosition = 0;
		
		this.setVertexIndexFor4Points(tileVertexIndices[0],
			baseFaceIndex + 24, baseFaceIndex + 19, baseFaceIndex + 20, baseFaceIndex + 21);
		this.setVertexIndexFor4Points(tileVertexIndices[0],
			baseFaceIndex + 19, baseFaceIndex + 6, baseFaceIndex + 7, baseFaceIndex + 20);
        this.setVertexIndexFor4Points(tileVertexIndices[0],
            baseFaceIndex + 21, baseFaceIndex + 20, baseFaceIndex + 9, baseFaceIndex + 10);
        this.setVertexIndexFor4Points(tileVertexIndices[0],
            baseFaceIndex + 20, baseFaceIndex + 7, baseFaceIndex + 8, baseFaceIndex + 9);


        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
        if(this.useMipmap){
            this.updateMipmapAndWriteToBuffer(tileVertexIndices);
        } else {
            this.writeToBuffer(tileVertexIndices);
        }

        this.textureLoaded = true;
	}
	
	updateMipmapAndWriteToBuffer(tileVertexIndices){
        if(DEBUG){
            console.log("mipmap Update - Batch: " + this.batchIndex);
        }
        this.gl.activeTexture(this.gl.TEXTURE0);
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        this.writeToBuffer(tileVertexIndices);

        this.anythingToRender = true;
	}
	
	writeToBuffer(tileVertexIndices) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffers[0]);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, tileVertexIndices[0], this.gl.STATIC_DRAW);
        this.vertexIndexBuffers[0].itemSize = 1;
		this.vertexIndexBuffers[0].numItems = tileVertexIndices[0].length;
		
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffers[1]);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, tileVertexIndices[1], this.gl.STATIC_DRAW);
        this.vertexIndexBuffers[1].itemSize = 1;
		this.vertexIndexBuffers[1].numItems = tileVertexIndices[1].length;
		
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffers[2]);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, tileVertexIndices[2], this.gl.STATIC_DRAW);
        this.vertexIndexBuffers[2].itemSize = 1;
		this.vertexIndexBuffers[2].numItems = tileVertexIndices[2].length;

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffers[3]);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, tileVertexIndices[3], this.gl.STATIC_DRAW);
        this.vertexIndexBuffers[3].itemSize = 1;
        this.vertexIndexBuffers[3].numItems = tileVertexIndices[3].length;

        this.anythingToRender = true;
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
		if(this.isInView() && !this.imageLoaded){
			this.startLoadingImage();
		}
		if(!this.anythingToRender){return;}
		
		let quadrantsToDraw = [true, true, true, true];
		if(global.order > this.order){
			this.getChildren().forEach((child, i) =>{
				if(child.isInView()
				){
					quadrantsToDraw[i] = !child.draw(pMatrix, vMatrix, modelMatrix)
				}
			});
		}

		healpixShader.useShader(pMatrix, vMatrix, modelMatrix);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		let drawsPerTexture = 4 * 6;
		quadrantsToDraw.forEach((quadrant, i) => {
			if(quadrant){
				healpixShader.setBuffers(this.vertexPositionBuffer, this.vertexIndexBuffers[i]);
				this.gl.drawElements(this.gl.TRIANGLES, drawsPerTexture, this.gl.UNSIGNED_SHORT, 0);
			}
		})
		return true; //Completed draw
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
	}
}
export default Tile;