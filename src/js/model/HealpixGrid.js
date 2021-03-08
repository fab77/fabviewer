"use strict";

import global from '../Global';

import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';
import eventBus from '../events/EventBus';
import VisibleTilesChangedEvent from '../events/VisibleTilesChangedEvent';
import {shaderUtility} from '../utils/ShaderUtility';
import TileNumber from './TileNumber';


class HealpixGrid {

	constructor() {
		this.tiles = new Set();
		this.tileNumbers = new Map();
		eventBus.registerForEvent(this, VisibleTilesChangedEvent.name);
		this.init();
	}
	
	notify(in_event){
		if (in_event instanceof VisibleTilesChangedEvent){
			this.removeTiles(in_event.tilesRemoved)
			this.addTiles(in_event.tilesToAddInOrder);
		}
	}

	addTiles(tilesToAdd){
		tilesToAdd.forEach(tile => {
			this.add(healpixGridTileBufferSingleton.getTile(tile.order, tile.ipix));
			this.tileNumbers.set(tile.key, new TileNumber(tile.order, tile.ipix)); 
		});
	}
	
	removeTiles(tilesToRemove){
		tilesToRemove.forEach((tileInfo) => {
			this.remove(healpixGridTileBufferSingleton.getTile(tileInfo.order, tileInfo.ipix));
			let tile = this.tileNumbers.get(tileInfo.key);
			tile.destruct();
			this.tileNumbers.delete(tileInfo.key);
		});
	}

	initGridShaders () {
		this.gridShaderProgram = this.gl.createProgram();
		let fragmentShader = this.getShader("healpix-grid-shader-fs");
		let vertexShader = this.getShader("healpix-grid-shader-vs");

		this.gl.attachShader(this.gridShaderProgram, vertexShader);
		this.gl.attachShader(this.gridShaderProgram, fragmentShader);
		this.gl.linkProgram(this.gridShaderProgram);
		this.gl.gridShaderProgram = this.gridShaderProgram;
		this.gridShaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.gridShaderProgram, "aVertexPosition");

		if (!this.gl.getProgramParameter(this.gridShaderProgram, this.gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		shaderUtility.useProgram(this.gridShaderProgram);
		
		this.setUniformLocation();
	}


	getShader(id){
		let shaderScript = document.getElementById(id);
		if (!shaderScript) {
			return null;
		}

		let str = "";
		let k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) {
				str += k.textContent;
			}
			k = k.nextSibling;
		}

		let shader;
		if (shaderScript.type == "x-shader/x-fragment") {
			shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = this.gl.createShader(this.gl.VERTEX_SHADER);
		} else {
			return null;
		}

		this.gl.shaderSource(shader, str);
		this.gl.compileShader(shader);

		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			alert(this.gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}

	setUniformLocation (){
		this.gridShaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.gridShaderProgram, "uPMatrix");
		this.gridShaderProgram.mMatrixUniform = this.gl.getUniformLocation(this.gridShaderProgram, "uMMatrix");
		this.gridShaderProgram.vMatrixUniform = this.gl.getUniformLocation(this.gridShaderProgram, "uVMatrix");
	}

	init(){
		if(this.isInitialized){
			return;
		}
		this.gl = global.gl;
		this.initGridShaders();
		this.isInitialized = true;
	}

	add(tile){
		this.tiles.add(tile); 
	}

	remove(tile){
		this.tiles.delete(tile);
		tile.destruct();
	}

	clear(){
		this.tiles.forEach(tile => {
			tile.destruct();
		});
		this.tiles.clear();
	}

	draw(pMatrix, vMatrix, modelMatrix){
		if(!this.isInitialized){
			return;
		}
		if(shaderUtility.lastUsedProgram != this.gridShaderProgram){
			shaderUtility.useProgram(this.gridShaderProgram);
			this.gl.disableVertexAttribArray(0);
			this.gl.disableVertexAttribArray(1);
			this.gl.disableVertexAttribArray(2);
			this.gl.enableVertexAttribArray(this.gridShaderProgram.vertexPositionAttribute);
		}
		
		this.gl.uniformMatrix4fv(this.gridShaderProgram.mMatrixUniform, false, modelMatrix);
		this.gl.uniformMatrix4fv(this.gridShaderProgram.pMatrixUniform, false, pMatrix);
		this.gl.uniformMatrix4fv(this.gridShaderProgram.vMatrixUniform, false, vMatrix);
		
		this.tiles.forEach(tile => {
			tile.draw(pMatrix, vMatrix, modelMatrix, this.gridShaderProgram.vertexPositionAttribute);
		});
		for(let tile of this.tileNumbers.values()) {
			tile.draw(pMatrix, vMatrix, modelMatrix);
		}
	}
	
}
export default HealpixGrid;