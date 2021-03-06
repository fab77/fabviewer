"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 * @param in_radius - number
 * @param in_gl - GL context
 * @param in_position - array of double e.g. [0.0, 0.0, -7]
 */

import AbstractSkyEntity from './AbstractSkyEntity';
import SphericalGrid from './SphericalGrid';
import XYZSystem from './XYZSystem';
import global from '../Global';
import {tileBufferSingleton} from './TileBuffer';
import {healpixShader} from './HealpixShader';
import HiPSFormatSelectedEvent from '../events/HiPSFormatSelectedEvent';
import eventBus from '../events/EventBus';
import VisibleTilesChangedEvent from '../events/VisibleTilesChangedEvent';
import {visibleTilesManager} from './VisibleTilesManager';
import AllSky from './AllSky';
import {shaderUtility} from '../utils/ShaderUtility';



class HiPS extends AbstractSkyEntity{

//	static className = "HiPSEntity";
	static className;
	
	constructor(in_radius, in_position, in_xRad, in_yRad, in_name, url, format, maxOrder, opacity, isGalacticHips){

		super(in_radius, in_position, in_xRad, in_yRad, in_name, isGalacticHips);

		HiPS.className = "HiPSEntity";
		this.radius = in_radius;
		this.gl = global.gl;
		
		this.format = format == undefined ? "png" : format;
		
		this.order = 0;

		this.URL = url;
		this.maxOrder = maxOrder == undefined ? 7 : maxOrder;

		this.showSphericalGrid = false;
		this.showXyzRefCoord = false;
		this.showEquatorialGrid = false;
		this.opacity = opacity ? opacity : 1.0;

		this.sphericalGrid = new SphericalGrid(1.004, this.gl);

		this.xyzRefSystem = new XYZSystem(this.gl);

		healpixShader.init();
		this.initShaderOld();
		
		visibleTilesManager.registerModel(this);
		this.registerForEvents();
		this.saturateFovWithTiles();
	}
	
	registerForEvents(){
		eventBus.registerForEvent(this, HiPSFormatSelectedEvent.name);
	}
	
	notify(in_event){
		if (in_event instanceof HiPSFormatSelectedEvent){
			if (in_event.hipsName == this.name && in_event.format.trim() !== this.format){
				this.clearAllTiles();
				this.format = in_event.format.trim();
				this.saturateFovWithTiles();
			}
		}
	}
	
	visibleTilesChanged(tilesRemoved, tilesToAddInOrder){
		this.removeTiles(tilesRemoved);
		if(this.isShowing){
			this.addTiles(tilesToAddInOrder);
		}
	}

	setOpacity(opacity){
		this.opacity = opacity;
	}

	clearAllTiles(){
		this.removeTiles(visibleTilesManager.getVisibleTilesOfHighestOrder(this.isGalacticHips));
		this.removeOrder0Tiles();
	}

	show(){
		this.isShowing = true;
		this.saturateFovWithTiles();
	}

	hide(){
		this.isShowing = false;
		this.clearAllTiles();
	}

	saturateFovWithTiles() {
		this.addOrder0Tiles();
		this.addTiles(visibleTilesManager.getVisibleTilesOfHighestOrder(this.isGalacticHips));
	}

	addTiles(tilesToAdd){
		if(tilesToAdd.size > 0 && tilesToAdd.values().next().value.order > this.maxOrder){
			this.addTiles(this.getParents(tilesToAdd));
		} else {
			tilesToAdd.forEach(tileInfo => {
				tileBufferSingleton.getTile(tileInfo.order, tileInfo.ipix, this.format, this.URL).addToView();
			});
		}
	}

	getParents(tileMap){
		let parents = new Map();
		tileMap.forEach((tileInfo) => {
			let key = (tileInfo.order - 1) + "/" + (tileInfo.ipix >> 2);
			parents.set(key, {order: tileInfo.order - 1, ipix : tileInfo.ipix >> 2, key: key});
		});
		return parents;
	}

	removeTiles(tilesToRemove, allVisibleTilesOfOneOrder){
		if(tilesToRemove.size > 0 && tilesToRemove.values().next().value.order > this.maxOrder){
			let parents = this.getParents(tilesToRemove);
			if(!allVisibleTilesOfOneOrder){
				allVisibleTilesOfOneOrder = visibleTilesManager.getVisibleTilesOfHighestOrder(this.isGalacticHips);
			}
			parents.forEach((tileInfo) => {
				if(allVisibleTilesOfOneOrder.has((tileInfo.order + 1) + "/" + (tileInfo.ipix * 4))
				|| allVisibleTilesOfOneOrder.has((tileInfo.order + 1) + "/" + (tileInfo.ipix * 4 + 1))
				|| allVisibleTilesOfOneOrder.has((tileInfo.order + 1) + "/" + (tileInfo.ipix * 4 + 2))
				|| allVisibleTilesOfOneOrder.has((tileInfo.order + 1) + "/" + (tileInfo.ipix * 4 + 3))
				){
					parents.delete(tileInfo.key, allVisibleTilesOfOneOrder);
				}
			});

			this.removeTiles(parents, this.getParents(allVisibleTilesOfOneOrder));
		} else {
			tilesToRemove.forEach((tileInfo) => {
				let tile = tileBufferSingleton.getIfAlreadyExist(tileInfo.order, tileInfo.ipix, this.format, this.URL);
				if(tile){
					tile.removeFromView();
				}
			});
		}
	}

	addOrder0Tiles(){
		for(let i = 0; i < 12; i++){
			tileBufferSingleton.getTile(0, i, this.format, this.URL).addToView();
		}
	}

	removeOrder0Tiles(){
		for(let i = 0; i < 12; i++){
			let tile = tileBufferSingleton.getIfAlreadyExist(0, i, this.format, this.URL);
			if(tile){
				tile.removeFromView();
			}
		}
	}

	initShaderOld () {
		var _self = this;
		var fragmentShader = getShader("hips-shader-fs");
		var vertexShader = getShader("hips-shader-vs");

		this.gl.attachShader(this.shaderProgram, vertexShader);
		this.gl.attachShader(this.shaderProgram, fragmentShader);
		this.gl.linkProgram(this.shaderProgram);
		this.gl.program = this.shaderProgram;

		if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		shaderUtility.useProgram(this.shaderProgram);

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");

		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");

		this.setUniformLocation();


	    function getShader(id){
	    	var shaderScript = document.getElementById(id);
			if (!shaderScript) {
				return null;
			}

			var str = "";
			var k = shaderScript.firstChild;
			while (k) {
				if (k.nodeType == 3) {
					str += k.textContent;
				}
				k = k.nextSibling;
			}

			var shader;
			if (shaderScript.type == "x-shader/x-fragment") {
				shader = _self.gl.createShader(_self.gl.FRAGMENT_SHADER);
			} else if (shaderScript.type == "x-shader/x-vertex") {
				shader = _self.gl.createShader(_self.gl.VERTEX_SHADER);
			} else {
				return null;
			}

			_self.gl.shaderSource(shader, str);
			_self.gl.compileShader(shader);

			if (!_self.gl.getShaderParameter(shader, _self.gl.COMPILE_STATUS)) {
				alert(_self.gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
	    }

	}

	setUniformLocation (){
		this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMMatrix");
		this.shaderProgram.vMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uVMatrix");
		this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler0");
		this.shaderProgram.uniformVertexTextureFactor = this.gl.getUniformLocation(this.shaderProgram, "uFactor0");
		this.shaderProgram.sphericalGridEnabledUniform = this.gl.getUniformLocation(this.shaderProgram, "uSphericalGrid");
		this.gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);
	}

	enableShader(pMatrix, vMatrix){
		shaderUtility.useProgram(this.shaderProgram);

		this.gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);
		this.gl.uniformMatrix4fv(this.shaderProgram.mMatrixUniform, false, this.modelMatrix);
		this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
		this.gl.uniformMatrix4fv(this.shaderProgram.vMatrixUniform, false, vMatrix);

		this.gl.uniform1f(this.shaderProgram.sphericalGridEnabledUniform, 0.0);
	}


	draw(pMatrix, vMatrix){
		this.gl.disable(this.gl.DEPTH_TEST);
		let failedOrder0Tiles = 0;
		for(let i = 0; i < 12; i++){
			let tile = tileBufferSingleton.getTile(0, i, this.format, this.URL);
			tile.draw(pMatrix, vMatrix, this.modelMatrix, this.opacity);
			if(tile.imageLoadFailed){
				failedOrder0Tiles++;
			}
		}
		if(failedOrder0Tiles == 12){
			if(!this.allsky){
				this.allsky = new AllSky(this.gl, this.shaderProgram, 3, this.URL, 1, this.format);
			}
			if(global.order > 2){
				this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
				
				let order3TilesDrawnSuccessfully = true;
				let order3Tiles = visibleTilesManager.getVisibleTilesOfOrder3();
				let ipixToSkipDuringAllskyDraw = new Set();
				order3Tiles.forEach((tileInfo)=>{
					let successfulDraw = tileBufferSingleton.getTile(tileInfo.order, tileInfo.ipix, this.format, this.URL).draw(pMatrix, vMatrix, this.modelMatrix, this.opacity);
					if(successfulDraw){
						ipixToSkipDuringAllskyDraw.add(tileInfo.ipix);
					}
					order3TilesDrawnSuccessfully = order3TilesDrawnSuccessfully && successfulDraw;
				});
				if (!order3TilesDrawnSuccessfully || order3Tiles.size == 0){
					this.allsky.draw(pMatrix, vMatrix, this.modelMatrix, this.opacity, ipixToSkipDuringAllskyDraw);
				} 
			} else {
				this.allsky.draw(pMatrix, vMatrix, this.modelMatrix, this.opacity, new Set());
			}
		}

		
		if (this.showSphericalGrid) {
			this.enableShader(pMatrix, vMatrix);
			this.sphericalGrid.draw(this.shaderProgram);
	    }
	    if (this.showEquatorialGrid) {
	    	this.drawEquatorialGrid();
	    }

	    if (this.showXyzRefCoord){
	    	this.xyzRefSystem.draw(this.shaderProgram);
		}
	}


	drawSphericalGrid (){

		var x, y, z;
		var r = 1.004;
		var thetaRad, phiRad;

		var thetaStep, phiStep;

		this.gl.uniform1f(this.shaderProgram.sphericalGridEnabledUniform, 1.0);

		thetaStep = 10;
		phiStep = 10;

		for (var theta = 0; theta < 180; theta += thetaStep){

			var phiVertexPosition = new Float32Array(360/phiStep * 3);

			thetaRad = degToRad(theta);

			for (var phi = 0; phi <360; phi += phiStep){

				phiRad = degToRad(phi);

				x = r * Math.sin(thetaRad) * Math.cos(phiRad);
				y = r * Math.sin(thetaRad) * Math.sin(phiRad);
				z = r * Math.cos(thetaRad);

				phiVertexPosition[ 3 * (phi/phiStep)] = x;
				phiVertexPosition[ 3 * (phi/phiStep) + 1] = y;
				phiVertexPosition[ 3 * (phi/phiStep) + 2] = z;

			}

			var phiVertexPositionBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, phiVertexPositionBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, phiVertexPosition, this.gl.STATIC_DRAW);

			this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

			this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

			this.gl.drawArrays(this.gl.LINE_LOOP, 0, 360/phiStep);
		}


		thetaStep = 10;
		phiStep = 10;

		for (var phi = 0; phi <360; phi += phiStep){

			var thetaVertexPosition = new Float32Array(360/thetaStep * 3);

			phiRad = degToRad(phi);


			for (var theta = 0; theta <360; theta += thetaStep){

				thetaRad = degToRad(theta);

				x = r * Math.sin(thetaRad) * Math.cos(phiRad);
				y = r * Math.sin(thetaRad) * Math.sin(phiRad);
				z = r * Math.cos(thetaRad);


				thetaVertexPosition[ 3 * (theta/thetaStep)] = x;
				thetaVertexPosition[ 3 * (theta/thetaStep) + 1] = y;
				thetaVertexPosition[ 3 * (theta/thetaStep) + 2] = z;

			}

			var thetaVertexPositionBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, thetaVertexPositionBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, thetaVertexPosition, this.gl.STATIC_DRAW);

			this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

			this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

			this.gl.drawArrays(this.gl.LINE_LOOP, 0, 360/thetaStep);

		}


			var versors = [
				[1.5, 0.0, 0.0],
				[0.0, 1.5, 0.0],
				[0.0, 0.0, 1.5],
				];

			var refSysPosition = new Float32Array(3 * 2);

			refSysPosition[0] = 0.0;
			refSysPosition[1] = 0.0;
			refSysPosition[2] = 0.0;

			/*
			 * x red
			 * y green
			 * z blue
			 */
			for (var k=0; k<3; k++){

				this.gl.uniform1f(this.shaderProgram.sphericalGridEnabledUniform, k + 2.0);

				refSysPosition[3] = versors[k][0];
				refSysPosition[4] = versors[k][1];
				refSysPosition[5] = versors[k][2];

				var refSysPositionBuffer = this.gl.createBuffer();
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, refSysPositionBuffer);
				this.gl.bufferData(this.gl.ARRAY_BUFFER, refSysPosition, this.gl.STATIC_DRAW);

				this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

				this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

				this.gl.drawArrays(this.gl.LINE_STRIP, 0, 2);

			}

	}

	drawEquatorialGrid (){

	}

}

export default HiPS;
