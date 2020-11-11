"use strict";

import global from '../Global';
import { tileBufferSingleton } from './TileBuffer';

const SHOW_ONLY_FULLY_LOADED_TILES = true;

class HealpixGridTileDrawer {

	constructor() {
		this.tiles = {};
	}

	initGridShaders () {
		this.gridShaderProgram = this.gl.createProgram();
		let fragmentShader = this.getShader("healpix-grid-shader-fs");
		let vertexShader = this.getShader("healpix-grid-shader-vs");

		this.gl.attachShader(this.gridShaderProgram, vertexShader);
		this.gl.attachShader(this.gridShaderProgram, fragmentShader);
		this.gl.linkProgram(this.gridShaderProgram);
		this.gl.gridShaderProgram = this.gridShaderProgram;

		if (!this.gl.getProgramParameter(this.gridShaderProgram, this.gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		this.gl.useProgram(this.gridShaderProgram);

		this.gridShaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.gridShaderProgram, "aVertexPosition");
		this.gl.enableVertexAttribArray(this.gridShaderProgram.vertexPositionAttribute);
		
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

	enableGridShader(pMatrix, vMatrix, modelMatrix){
		this.gl.useProgram(this.gridShaderProgram);

		this.gridShaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.gridShaderProgram, "uPMatrix");
		this.gridShaderProgram.mMatrixUniform = this.gl.getUniformLocation(this.gridShaderProgram, "uMMatrix");
		this.gridShaderProgram.vMatrixUniform = this.gl.getUniformLocation(this.gridShaderProgram, "uVMatrix");

		this.gridShaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.gridShaderProgram, "aVertexPosition");

		this.gl.uniformMatrix4fv(this.gridShaderProgram.mMatrixUniform, false, modelMatrix);
		this.gl.uniformMatrix4fv(this.gridShaderProgram.pMatrixUniform, false, pMatrix);
		this.gl.uniformMatrix4fv(this.gridShaderProgram.vMatrixUniform, false, vMatrix);
	}

	init(){
		this.gl = global.gl;
		this.initGridShaders();
		this.isInitialized = true;
	}

	add(tile){
		this.tiles[tile.key] = tile; 
	}

	remove(tile){
		delete this.tiles[tile.key];
		tile.destruct();
	}

	clear(){
		this.tiles = {};
	}

	draw(pMatrix, vMatrix, modelMatrix){
		this.enableGridShader(pMatrix, vMatrix, modelMatrix);
		Object.keys(this.tiles).forEach(tileKey => {
			// this.drawTile(this.tiles[tileKey]);
		});
	}

	drawTile(tile){
		if(SHOW_ONLY_FULLY_LOADED_TILES){
			let correspondingTile = tileBufferSingleton.getTile(tile.order, tile.ipix);
			if(!correspondingTile.textureLoaded){return;}
		}

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, tile.vertexPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, tile.vertexPosition, this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(tile.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(tile.vertexPositionAttribute);
		
		this.gl.drawArrays(this.gl.LINE_LOOP, 0, 4);
	}
}
export const healpixGridTileDrawerSingleton = new HealpixGridTileDrawer();