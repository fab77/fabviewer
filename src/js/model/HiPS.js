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
import RayPickingUtils from '../utils/RayPickingUtils';
import {Vec3, Pointing} from 'healpix';
import {tileBufferSingleton} from './TileBuffer';
import {healpixGridTileDrawerSingleton} from './HealpixGridTileDrawer';
import {tileDrawerSingleton} from './TileDrawer';

class HiPS extends AbstractSkyEntity{

	constructor(in_radius, in_gl, in_canvas, in_position, in_xRad, in_yRad, in_name, in_fovUtils){

		super(in_radius, in_gl, in_canvas, in_position, in_xRad, in_yRad, in_name, in_fovUtils);

		this.radius = in_radius;
		this.gl = in_gl;
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA  );
    this.fitsEnabled = false;
		this.fitsReader = null;

		this.order = 3;

    this.URL = "http://skies.esac.esa.int//Herschel/normalized/hips250_pnorm_allsky/";
    this.imgFormat = "png";
		//this.URL = "https://skies.esac.esa.int/DSSColor/";
		this.maxOrder = 7;
		this.visibleTiles = {};

		this.showSphericalGrid = false;
		this.showXyzRefCoord = false;
		this.showEquatorialGrid = false;

		this.sphericalGrid = new SphericalGrid(1.004, this.gl);

		this.xyzRefSystem = new XYZSystem(this.gl);

		this.initShaders();
		healpixGridTileDrawerSingleton.init();
		tileDrawerSingleton.init();
		setInterval(()=> {this.updateVisibleTiles();}, 100);
	}

	initShaders () {
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

		this.gl.useProgram(this.shaderProgram);

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
		this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

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
		this.gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);
	}

	refreshModel (in_fov, in_pan){
		if ( in_fov >= 175){
			this.order = 0;
		}else if ( in_fov >= 150){
			this.order = 1;
		}else if ( in_fov >= 25){
			this.order = 2;
		}else if ( in_fov >= 15){
			this.order = 3;
		}else if (in_fov >= 8){
			this.order = 4;
		}else if (in_fov >= 4){
			this.order = 5;
		}else if (in_fov >= 1.7){
			this.order = 6;
		}else if (in_fov >= 0.9){
			this.order = 7;
		}else if (in_fov >= 0.5){
			this.order = 8;
		}else if (in_fov >= 0.3){
			this.order = 9;
		}else if (in_fov >= 0.15){
			this.order = 10;
		}else if (in_fov >= 0.10){
			this.order = 11;
		}else{
			this.order = 12;
		}
		this.order = Math.min(this.order, this.maxOrder);
		
		if ( global.order != this.order && DEBUG){
			console.log("Changed order = "+ this.order);
		}
		global.order = this.order;

		this.changedModel = true;
	}

	updateVisibleTiles (){
		if(!this.changedModel){return;}
		this.changedModel = false;
		let previouslyVisibleKeys = Object.keys(this.visibleTiles);
		let tilesRemoved = this.visibleTiles;
		let tilesAdded = {};

		this.visibleTiles = {};
		let tilesToAddInOrder = this.pollCenter(previouslyVisibleKeys, tilesRemoved, tilesAdded);

		this.pollViewAndAddTiles(7, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
		
		Object.keys(this.visibleTiles).forEach(key =>{
			this.addNeighbours(this.visibleTiles[key].ipix, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
		});

		Object.keys(tilesRemoved).forEach(key => {
			tilesRemoved[key].removeFromView();
		});
		tilesToAddInOrder.forEach(tile => {
			tile.addToView();
		});
	}

	pollViewAndAddTiles(xyPollingPoints, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder) {
		let maxX = this.gl.canvas.width;
		let maxY = this.gl.canvas.height;

		for (let i = 0; i <= maxX; i += maxX / xyPollingPoints) {
			for (let j = 0; j <= maxY; j += maxY / xyPollingPoints) {
				this.pollPoint(i, j, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
			}
		}
	}

	pollCenter(previouslyVisibleKeys, tilesRemoved, tilesAdded) {
		let tilesToAddInOrder = [];
		let maxX = this.gl.canvas.width;
		let maxY = this.gl.canvas.height;
		let xyPollingPoints = 3;
		this.pollPoint(maxX / 2, maxY / 2, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
		for (let i = maxX / xyPollingPoints; i <= maxX * 2 / xyPollingPoints; i += maxX / xyPollingPoints) {
			for (let j = maxY / xyPollingPoints; j <= maxY * 2 / xyPollingPoints; j += maxY / xyPollingPoints) {
				this.pollPoint(i, j, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
			}
		}
		return tilesToAddInOrder;
	}

	pollPoint(x, y, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder) {
		let intersectionWithModel = RayPickingUtils.getIntersectionPointWithSingleModel(x, y, this);
		let intersectionPoint = intersectionWithModel.intersectionPoint;
		// TODO probably it would be better to use query_disc_inclusive from HEALPix
		// against a polygon. Check my FHIPSWebGL2 project (BufferManager.js -> updateVisiblePixels)
		if (intersectionPoint.length > 0) {
			let currP = new Pointing(new Vec3(intersectionPoint[0], intersectionPoint[1], intersectionPoint[2]));
			let currPixNo = global.getHealpix(this.order).ang2pix(currP);
			if (currPixNo >= 0) {
				let tile = tileBufferSingleton.getTile(this.order, currPixNo);
				this.visibleTiles[this.order + "/" + currPixNo] = tile;
				if (previouslyVisibleKeys.includes(this.order + "/" + currPixNo)) {
					delete tilesRemoved[this.order + "/" + currPixNo];
				} else {
					if (tilesAdded[this.order + "/" + currPixNo] !== tile) {
						tilesToAddInOrder.push(tile);
					}
					tilesAdded[this.order + "/" + currPixNo] = tile;
				}
			}
		}
	}

	addNeighbours(currPixNo, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder) {
		let neighbours = global.getHealpix(this.order).neighbours(currPixNo);
		for (let k = 0; k < neighbours.length; k++) {
			if (neighbours[k] >= 0 && this.visibleTiles[neighbours[k]] == undefined) {
				let tile = tileBufferSingleton.getTile(this.order, neighbours[k]);
				this.visibleTiles[this.order + "/" + neighbours[k]] = tile;

				if (previouslyVisibleKeys.includes(this.order + "/" + neighbours[k])) {
					delete tilesRemoved[this.order + "/" + neighbours[k]];
				} else {
					if(tilesAdded[this.order + "/" + neighbours[k]] !== tile){
						tilesToAddInOrder.push(tile);
					}
					tilesAdded[this.order + "/" + neighbours[k]] = tile;
				}
			}
		}
		return neighbours;
	}

	enableShader(pMatrix, vMatrix){
		this.gl.useProgram(this.shaderProgram);

		this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMMatrix");
		this.shaderProgram.vMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uVMatrix");
		this.shaderProgram.samplerUniform = this.gl.getUniformLocation(this.shaderProgram, "uSampler0");
		this.shaderProgram.uniformVertexTextureFactor = this.gl.getUniformLocation(this.shaderProgram, "uFactor0");
		this.shaderProgram.sphericalGridEnabledUniform = this.gl.getUniformLocation(this.shaderProgram, "uSphericalGrid");

		this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");

		this.gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);
		this.gl.uniformMatrix4fv(this.shaderProgram.mMatrixUniform, false, this.modelMatrix);
		this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
		this.gl.uniformMatrix4fv(this.shaderProgram.vMatrixUniform, false, vMatrix);

		this.uniformVertexTextureFactorLoc = this.gl.getUniformLocation(this.shaderProgram, "uFactor0");

		this.gl.uniform1f(this.shaderProgram.sphericalGridEnabledUniform, 0.0);
	}


	draw(pMatrix, vMatrix){
		this.gl.enable(this.gl.BLEND);
		tileDrawerSingleton.draw(pMatrix, vMatrix, this.modelMatrix);
		this.gl.disable(this.gl.BLEND);
		
		healpixGridTileDrawerSingleton.draw(pMatrix, vMatrix, this.modelMatrix);
		
		this.enableShader(pMatrix, vMatrix);
		if (this.showSphericalGrid) {
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
