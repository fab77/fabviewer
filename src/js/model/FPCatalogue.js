"use strict";

import {cartesianToSpherical, sphericalToCartesian, colorHex2RGB} from '../utils/Utils';
import {mat4} from 'gl-matrix';
import global from '../Global';
import Point from '../utils/Point';
import CoordsType from '../utils/CoordsType';
import Footprint from './Footprint';


class FPCatalogue{
	
	static ELEM_SIZE = 5;
	static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
	
	#datasetName;
	#metadata;
	#raIdx;
	#decIdx;
	#nameIdx;
	#stcsIdx;
	#uidIdx;
	#shaderProgram;
	#gl;
	#vertexCataloguePositionBuffer;
	#vertexSelectionCataloguePositionBuffer;
	#footprints = [];
	#oldMouseCoords;
	#vertexCataloguePosition;
	#attribLocations = {};
	#selectionIndexes;
	#descriptor;
	#totPoints;	// Used to compute item size in the GL buffer
	#indexes;
	
	
	constructor(in_datasetName, in_metadata, in_raIdx, in_decIdx, in_uidIdx, in_stcsIdx, in_descriptor){

		this.#datasetName = in_datasetName;
		this.#metadata = in_metadata;
		this.#raIdx = in_raIdx;
		this.#decIdx = in_decIdx;
		this.#uidIdx = in_uidIdx;
		this.#stcsIdx = in_stcsIdx;
		
		this.#descriptor = in_descriptor;
		
		this.#totPoints = 0;
		
		this.#gl = global.gl;
		this.#shaderProgram = this.#gl.createProgram();
		this.#vertexCataloguePositionBuffer = this.#gl.createBuffer();
		this.#vertexSelectionCataloguePositionBuffer = this.#gl.createBuffer();
		
		this.#vertexCataloguePosition = [];
		
		this.#selectionIndexes = [];
		
		this.#oldMouseCoords = null;
		
		this.#attribLocations = {
				position: 0,
				selected: 1,
				pointSize: 2,
				color: [0.0, 1.0, 0.0, 1.0]
		};
		
		this.initShaders();
		
	}
	
	
	
	
	initShaders(){
		
		var _self = this;
		var gl = this.#gl;
		var shaderProgram = this.#shaderProgram;
		
		var fragmentShader = this.loadShaderFromDOM("fpcat-shader-fs");
		var vertexShader = this.loadShaderFromDOM("fpcat-shader-vs");
		
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		gl.useProgram(shaderProgram);

		// TODO USELESS
		this.setUniformLocation();
		
	}
	
	
	loadShaderFromDOM(shaderId) {
		var gl = this.#gl;
		
	    var shaderScript = document.getElementById(shaderId);
	    
	    // If we don't find an element with the specified id
	    // we do an early exit 
	    if (!shaderScript) {
	    	return null;
	    }
	    
	    // Loop through the children for the found DOM element and
	    // build up the shader source code as a string
	    var shaderSource = "";
	    var currentChild = shaderScript.firstChild;
	    while (currentChild) {
	        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
	      		shaderSource += currentChild.textContent;
	        }
	        currentChild = currentChild.nextSibling;
	    }
	    
	    var shader;
	    if (shaderScript.type == "x-shader/x-fragment") {
	    	shader = gl.createShader(gl.FRAGMENT_SHADER);
	    } else if (shaderScript.type == "x-shader/x-vertex") {
	    	shader = gl.createShader(gl.VERTEX_SHADER);
	    } else {
	    	return null;
	    }
	    
	    gl.shaderSource(shader, shaderSource);
	    gl.compileShader(shader);
	    
	    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	    	alert(gl.getShaderInfoLog(shader));
	    	return null;
	    } 
	    return shader;
	}
	
	
	// TODO USELESS
	setUniformLocation(){
		
		var gl = this.#gl;
		var shaderProgram = this.#shaderProgram;

		shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

	}
	
	
	get datasetName(){
		return this.#datasetName;
	}
	
	get footprints(){
		return this.#footprints;
	}
	
	addFootprint(in_footprint){
		this.#footprints.push(in_footprint);
	}
	
	addFootprints(in_data){
		let j,
		point,
		footprint;
		
		for ( j = 0; j < in_data.length; j++){
			
			point = new Point({
				"raDeg": in_data[j][this.#raIdx],
				"decDeg": in_data[j][this.#decIdx]
			}, CoordsType.ASTRO);
			
			footprint = new Footprint(point,in_data[j][this.#uidIdx], in_data[j][this.#stcsIdx], in_data[j]);
			this.addFootprint(footprint);
			this.#totPoints += footprint.totPoints;
		}
		console.log("this.#totPoints="+this.#totPoints);
		console.log("this.#footprints.length="+this.#footprints.length);
		this.initBuffer();
		
	}
	
	
	
	
	
	
	initBuffer () {

		
		var nFootprints = this.#footprints.length;
		this.#indexes = new Uint16Array(this.#totPoints * 2 + nFootprints);
		
		let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
		
		var gl = this.#gl;
			
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#vertexCataloguePositionBuffer);
		

		// size: total number of points among all footprints + 1 selection for each footprint + 1 line size for each footprint
		this.#vertexCataloguePosition = new Float32Array( this.#totPoints + 2 * (nFootprints) );
		var positionIndex = 0;
		var vIdx = 0;

		var R = 1.00000000000000001;
		for(var j = 0; j < nFootprints; j++){
			
			let footprint = this.#footprints[j].polygons;
			for (let polyIdx in footprint){
				for (let pointIdx in footprint[polyIdx]){
					this.#vertexCataloguePosition[positionIndex] = footprint[polyIdx][pointIdx].x;
					this.#vertexCataloguePosition[positionIndex+1] = footprint[polyIdx][pointIdx].y;
					this.#vertexCataloguePosition[positionIndex+2] = footprint[polyIdx][pointIdx].z;
					
					this.#indexes[vIdx] = positionIndex;
					this.#indexes[vIdx+1] = positionIndex+1;
					this.#indexes[vIdx+2] = positionIndex+2;
					
					vIdx += 3;
					positionIndex += 3;
				}
				
				this.#indexes[vIdx+1] = MAX_UNSIGNED_SHORT; // TODO last one shouldn't be added
				vIdx += 1;
				this.#vertexCataloguePosition[positionIndex+1] = 0.0;
				this.#vertexCataloguePosition[positionIndex+2] = 8.0;
				positionIndex += 2;
				
			}
		}
		
		console.log("Buffer initialized");

//		glEnable ( GL_PRIMITIVE_RESTART_FIXED_INDEX ); // 65535
		
	}
	
	
	
	
//	checkSelection (in_mouseCoords) {
//		var sources = this.#sources;
//		var nSources = sources.length;
//		var selectionIndexes = [];
//		
//		for(var j = 0; j < nSources; j++){
//			let sourcexyz = [sources[j].point.x , sources[j].point.y , sources[j].point.z];
//			
//			let dist = Math.sqrt( (sourcexyz[0] - in_mouseCoords[0] )*(sourcexyz[0] - in_mouseCoords[0] ) + (sourcexyz[1] - in_mouseCoords[1] )*(sourcexyz[1] - in_mouseCoords[1] ) + (sourcexyz[2] - in_mouseCoords[2] )*(sourcexyz[2] - in_mouseCoords[2] ) );
//			if (dist <= 0.004){
//				
//				selectionIndexes.push(j);
//					
//			}
//		}
//		return selectionIndexes;
//		
//	}
	
	

	
	enableShader(in_mMatrix){

		this.#shaderProgram.catUniformMVMatrixLoc = this.#gl.getUniformLocation(this.#shaderProgram, "uMVMatrix");
		this.#shaderProgram.catUniformProjMatrixLoc = this.#gl.getUniformLocation(this.#shaderProgram, "uPMatrix");
		
		this.#attribLocations.position  = this.#gl.getAttribLocation(this.#shaderProgram, 'aCatPosition');
		
		this.#attribLocations.selected  = this.#gl.getAttribLocation(this.#shaderProgram, 'a_selected');

		this.#attribLocations.pointSize = this.#gl.getAttribLocation(this.#shaderProgram, 'a_pointsize');

		this.#attribLocations.color = this.#gl.getUniformLocation(this.#shaderProgram,'u_fragcolor');
		
		var mvMatrix = mat4.create();
		mvMatrix = mat4.multiply(mvMatrix, global.camera.getCameraMatrix(), in_mMatrix);
		this.#gl.uniformMatrix4fv(this.#shaderProgram.catUniformMVMatrixLoc, false, mvMatrix);
		this.#gl.uniformMatrix4fv(this.#shaderProgram.catUniformProjMatrixLoc, false, global.pMatrix);

	}
	
	/**
	 * @param in_Matrix: model matrix the current catalogue is associated to (e.g. HiPS matrix)
	 */
	draw(in_mMatrix, in_mouseCoords){
		

		this.#gl.useProgram(this.#shaderProgram);
		
		this.enableShader(in_mMatrix);
		
		this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#vertexCataloguePositionBuffer);
		
		// setting source position
		this.#gl.vertexAttribPointer(this.#attribLocations.position, 3, this.#gl.FLOAT, false, FPCatalogue.BYTES_X_ELEM * FPCatalogue.ELEM_SIZE, 0);
		this.#gl.enableVertexAttribArray(this.#attribLocations.position);

//		// setting selected sources
//		this.#gl.vertexAttribPointer(this.#attribLocations.selected, 1, this.#gl.FLOAT, false, Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE, Catalogue.BYTES_X_ELEM * 3);
//		this.#gl.enableVertexAttribArray(this.#attribLocations.selected);

		// TODO not needed overloading. The size can be set with uniform. setting point size 
		this.#gl.vertexAttribPointer(this.#attribLocations.pointSize, 1, this.#gl.FLOAT, false, FPCatalogue.BYTES_X_ELEM * FPCatalogue.ELEM_SIZE, FPCatalogue.BYTES_X_ELEM * 4);
		this.#gl.enableVertexAttribArray(this.#attribLocations.pointSize);
		
		
		// setting source shape color 
		var rgb = colorHex2RGB(this.#descriptor.shapeColor);
		var alpha = 1.0;
		rgb[3] = alpha;
		this.#gl.uniform4f(this.#attribLocations.color, rgb[0], rgb[1], rgb[2], rgb[3]);
		
//		if (in_mouseCoords != null && in_mouseCoords != this.#oldMouseCoords){
//			
//			for (var k = 0; k < this.#selectionIndexes.length; k++){
//				this.#vertexCataloguePosition[ (this.#selectionIndexes[k] * Catalogue.ELEM_SIZE) + 3] = 0.0;
//				this.#vertexCataloguePosition[ (this.#selectionIndexes[k] * Catalogue.ELEM_SIZE) + 4] = 8.0;
//			}	
//			
//			
//
//			this.#selectionIndexes = this.checkSelection(in_mouseCoords);
//
//			let selectedSources = [];
//			for (var i = 0; i < this.#selectionIndexes.length; i++){
//				selectedSources.push(this.#sources[this.#selectionIndexes[i]]);
//			}
//			
//			if (this.#selectionIndexes.length > 0){
//				const event = new CustomEvent('sourceSelected', { detail: selectedSources });
//				window.dispatchEvent(event);	
//			}
//			
//			for (var i = 0; i < this.#selectionIndexes.length; i++) {
//				
//				this.#vertexCataloguePosition[ (this.#selectionIndexes[i] * Catalogue.ELEM_SIZE) + 3] = 1.0;
//				this.#vertexCataloguePosition[ (this.#selectionIndexes[i] * Catalogue.ELEM_SIZE) + 4] = 10.0;
//				
//			}
//
//		}
		this.#gl.bufferData(this.#gl.ARRAY_BUFFER, this.#vertexCataloguePosition, this.#gl.STATIC_DRAW);
		

		var numItems = this.#vertexCataloguePosition.length/FPCatalogue.ELEM_SIZE;

		 
		/* 
		 * this is not needed in WebGL since it's enale dby default 
		this.#gl.glEnable ( GL_PRIMITIVE_RESTART_FIXED_INDEX ); // 65535
		*/
		this.#gl.drawElements (this.#gl.LINE_LOOP, this.#footprints.length ,this.#gl.UNSIGNED_SHORT, this.#indexes);
		
//		for (let footprint in this.#footprints){
//
//			/* 
//			 * this is not needed in WebGL since it's enale dby default 
//			this.#gl.glEnable ( GL_PRIMITIVE_RESTART_FIXED_INDEX ); // 65535
//			*/
//			this.#gl.drawElements (this.#gl.LINE_LOOP, this.#footprints.length ,this.#gl.UNSIGNED_SHORT, this.#indexes);
//			
//			// void gl.drawRangeElements(mode, start, end, count, type, offset);
////			this.#gl.drawRangeElements(this.#gl.LINE_LOOP, start, end, count, type, offset);
//
//
//		}
		
//		// TODO CHANGE ME for footprint it should be LINE_LOOP
//		this.#gl.drawArrays(this.#gl.POINTS, 0, numItems);

		this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);
		this.#oldMouseCoords = in_mouseCoords;
		
	}

	
}


export default FPCatalogue;