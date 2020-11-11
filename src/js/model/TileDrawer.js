"use strict";

import global from '../Global';
import BatchOfTiles from './BatchOfTiles';

//TODO dynamically set to utilize the most out of every hardware
// console.log("gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS); " + this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS));
// console.log("gl.getParameter(gl.MAX_VIEWPORT_DIMS); " + this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS));
// console.log("gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS); " + this.gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
const N_TILES_PER_ROW = 1;
const N_TILES_PER_TEXTURE = N_TILES_PER_ROW * N_TILES_PER_ROW;
const N_MAX_POSSIBLE_TEXTURES = Math.ceil(200 / N_TILES_PER_TEXTURE);
const N_MAX_POSSIBLE_TILES_IN_MEMORY = N_MAX_POSSIBLE_TEXTURES * N_TILES_PER_TEXTURE;
const USE_MIPMAP = true;

class TileDrawer {

	constructor() {
		this.tiles = {};
		this.tileArray = [];
		this.tilesWaitingToBeRemoved = {};
		this.textureCoordinates = new Float32Array(8 * N_TILES_PER_TEXTURE * N_MAX_POSSIBLE_TEXTURES);
		this.vertexIndices = new Uint16Array(6 * N_TILES_PER_TEXTURE * N_MAX_POSSIBLE_TEXTURES);
		this.vertexPosition = new Float32Array(12 * N_TILES_PER_TEXTURE * N_MAX_POSSIBLE_TEXTURES);
		this.nextIndex = 0;
		this.batchOfTiles = [];
		this.indiciesToReuse = [];
		this.numberOfVisibleTiles = 0;
		this.numberOfTilesRequired = 0;
		this.numberOfTilesRequiredMax = 0;
		this.orderWithMaxRequiredTiles = 0;
	}

	initShaders () {
		this.shaderProgram = this.gl.createProgram();
		let fragmentShader = this.getShader("hips-shader-fs");
		let vertexShader = this.getShader("hips-shader-vs");

		this.gl.attachShader(this.shaderProgram, vertexShader);
		this.gl.attachShader(this.shaderProgram, fragmentShader);
		this.gl.linkProgram(this.shaderProgram);
		this.gl.shaderProgram = this.shaderProgram;

		if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		this.gl.useProgram(this.shaderProgram);

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
		this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

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
		this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMMatrix");
		this.shaderProgram.vMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uVMatrix");
		this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler0");
		this.shaderProgram.uniformVertexTextureFactor = this.gl.getUniformLocation(this.shaderProgram, "uFactor0");
		this.gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);
	}

	enableShader(pMatrix, vMatrix, modelMatrix){
		this.gl.useProgram(this.shaderProgram);

		this.shaderProgram.uniformVertexTextureFactor = this.gl.getUniformLocation(this.shaderProgram, "uFactor0");
		this.shaderProgram.sphericalGridEnabledUniform = this.gl.getUniformLocation(this.shaderProgram, "uSphericalGrid");

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");

		this.gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);
		this.gl.uniformMatrix4fv(this.shaderProgram.mMatrixUniform, false, modelMatrix);
		this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
		this.gl.uniformMatrix4fv(this.shaderProgram.vMatrixUniform, false, vMatrix);

		this.uniformVertexTextureFactorLoc = this.gl.getUniformLocation(this.shaderProgram, "uFactor0");
	}

	init(){
		this.gl = global.gl;
		this.initShaders();
		this.vertexPositionBuffer = this.gl.createBuffer();
		this.vertexTextureCoordBuffer = this.gl.createBuffer();
		this.vertexIndexBuffer = this.gl.createBuffer();

		this.batchOfTiles.push(new BatchOfTiles(N_TILES_PER_ROW, 0, this.vertexPositionBuffer, this.vertexTextureCoordBuffer, this.vertexIndexBuffer, USE_MIPMAP));
		this.gl.activeTexture(this.gl.TEXTURE0);
			
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.DYNAMIC_DRAW);
		this.vertexPositionBuffer.itemSize = 3;
		this.vertexPositionBuffer.numItems = this.vertexPosition.length;
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureCoordinates, this.gl.DYNAMIC_DRAW);
		this.vertexTextureCoordBuffer.itemSize = 2;
		this.vertexTextureCoordBuffer.numItems = this.textureCoordinates.length;
		
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndices, this.gl.DYNAMIC_DRAW);
		this.vertexIndexBuffer.itemSize = 1;
		this.vertexIndexBuffer.numItems = this.vertexIndices.length;
	}

	add(tile){
		if(!this.tiles[tile.key]){
			if(DEBUG){
				this.numberOfTilesRequired++;
				if(this.numberOfTilesRequired > this.numberOfTilesRequiredMax){
					this.orderWithMaxRequiredTiles = global.order;
					this.numberOfTilesRequiredMax = this.numberOfTilesRequired;
				}
				console.log("Number of required tiles " + this.numberOfTilesRequired + " Max: " 
					+ this.numberOfTilesRequiredMax + " order " + this.orderWithMaxRequiredTiles);
			}
			this.tiles[tile.key] = tile;
			if(!tile.imageLoaded){
				tile.startLoadingImage();
			} else if(!tile.textureLoaded){
				this.tileLoaded(tile);
			} else {
				//Still in buffer
				if(DEBUG){
					console.log("Tile not fully removed yet - Using same index - Removing " + tile.key);
				}
				delete this.tilesWaitingToBeRemoved[tile.key];
				this.indiciesToReuse = this.indiciesToReuse.filter(item => item !== tile.key);
			}
		}
	}

	remove(tile){
		if(this.tiles[tile.key]){
			if(DEBUG){
				this.numberOfTilesRequired--;
			}
			if(!tile.imageLoaded){
				tile.stopLoadingImage();
			} else if(tile.textureLoaded && !this.tilesWaitingToBeRemoved[tile.key]) {
				this.indiciesToReuse.push(tile.key);
				tile.inListToBeRemoved = true;
				this.tilesWaitingToBeRemoved[tile.key] = tile;
				if(DEBUG){
					console.log("Removing tile - Adding index " + tile.index + " to indiciesToReuse");
				}
			}
			delete this.tiles[tile.key];
		}
	}

	setTileIndex(tile){
		if(this.nextIndex >= N_MAX_POSSIBLE_TILES_IN_MEMORY){
			if(this.indiciesToReuse.length > 0){
				let tileKeyToOverwrite = this.indiciesToReuse.shift();
				let tileToRemove = this.tilesWaitingToBeRemoved[tileKeyToOverwrite];
				tile.index = tileToRemove.index;
				tileToRemove.destruct();
				this.numberOfVisibleTiles--;

				delete this.tilesWaitingToBeRemoved[tileKeyToOverwrite];
				if(DEBUG){
					console.log("Reusing old index " + tile.index);
				}
			} else {
				tile.index = this.nextIndex;
				this.nextIndex++;
				console.error("Buffers full ");
				//TODO if this happens, there will be a buffer overflow since vertexPositionBuffer is not big enough
			}
		} else {
			tile.index = this.nextIndex;
			this.nextIndex++;
			if(DEBUG){
				console.log("NextIndex " + this.nextIndex);
			}
		}
	}

	tileLoaded(tile){
		if(!this.tiles[tile.key]){
			return;
		}
		this.setTileIndex(tile);
		this.tileArray[tile.index] = tile;
		this.numberOfVisibleTiles++;
		if(DEBUG){
			console.log("numberOfVisibleTiles: " + this.numberOfVisibleTiles);
		}
		let batchIndex = Math.floor(tile.index / N_TILES_PER_TEXTURE);
		if(this.batchOfTiles[batchIndex] == undefined){
			this.batchOfTiles[batchIndex] = new BatchOfTiles(N_TILES_PER_ROW, batchIndex, this.vertexPositionBuffer, this.vertexTextureCoordBuffer, this.vertexIndexBuffer, USE_MIPMAP);
		}
		this.batchOfTiles[batchIndex].addTile(tile);
	}

	draw(pMatrix, vMatrix, modelMatrix){
		this.enableShader(pMatrix, vMatrix, modelMatrix);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
		this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
		
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		
		this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
		this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
		this.batchOfTiles.forEach((batch) => batch.draw(this.shaderProgram.samplerUniform));
	}

}
export const tileDrawerSingleton = new TileDrawer();