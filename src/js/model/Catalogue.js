"use strict";

import {cartesianToSpherical, sphericalToCartesian, colorHex2RGB} from '../utils/Utils';
import {mat4} from 'gl-matrix';
import global from '../Global';
import Point from '../utils/Point';
import CoordsType from '../utils/CoordsType';
import Source from './Source';
import {shaderUtility} from '../utils/ShaderUtility';



class Catalogue{
	
	static ELEM_SIZE = 5;
	static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
	
	#name;
	#metadata;
	#raIdx;
	#decIdx;
	#nameIdx;
	#shaderProgram;
	#gl;
	#vertexCataloguePositionBuffer;
	#vertexSelectionCataloguePositionBuffer;
	#sources = [];
	#oldMouseCoords;
	#vertexCataloguePosition;
	#attribLocations = {};
	#selectionIndexes;
	#descriptor;
	
	
	constructor(in_name, in_metadata, in_raIdx, in_decIdx, in_nameIdx, in_descriptor){

		this.#name = in_name;
		this.#metadata = in_metadata;
		this.#raIdx = in_raIdx;
		this.#decIdx = in_decIdx;
		this.#nameIdx = in_nameIdx;
		this.#descriptor = in_descriptor;
		
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
		
		var fragmentShader = this.loadShaderFromDOM("cat-shader-fs");
		var vertexShader = this.loadShaderFromDOM("cat-shader-vs");
		
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		shaderUtility.useProgram(shaderProgram);

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
	
	
	get name(){
		return this.#name;
	}
	
	get sources(){
		return this.#sources;
	}
	
	addSource(in_source){
		this.#sources.push(in_source);
	}
	
	/**
	 * @param in_sources: it's the TAP response data object 
	 */
	addSources(in_data){
		var j,
		point,
		source;
		
		for ( j = 0; j < in_data.length; j++){
			
			point = new Point({
				"raDeg": in_data[j][this.#raIdx],
				"decDeg": in_data[j][this.#decIdx]
			}, CoordsType.ASTRO);
			
			source = new Source(point, in_data[j][this.#nameIdx], in_data[j]);
			this.addSource(source);
		}
		this.initBuffer();
	}
	
	
	
	initBuffer () {

		var gl = this.#gl;

		var sources = this.#sources;
			
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#vertexCataloguePositionBuffer);
		var nSources = sources.length;

		this.#vertexCataloguePosition = new Float32Array( nSources * Catalogue.ELEM_SIZE );
		var positionIndex = 0;
		
		// max num of decimal places is 17
		var R = 1.00000000000000001;
		for(var j = 0; j < nSources; j++){
			
			// the commented part has been moved into Point.js
//			let xyz = [sources[j].point.x, sources[j].point.y, sources[j].point.z];
//			let phiTheta = cartesianToSpherical(xyz);
//			let finalXYZ = sphericalToCartesian(phiTheta.phi, phiTheta.theta, R);
//			this.#vertexCataloguePosition[positionIndex] = finalXYZ[0];
//			this.#vertexCataloguePosition[positionIndex+1] = finalXYZ[1];
//			this.#vertexCataloguePosition[positionIndex+2] = finalXYZ[2];
			
			// source position on index 0, 1, 2
			this.#vertexCataloguePosition[positionIndex] = sources[j].point.x;
			this.#vertexCataloguePosition[positionIndex+1] = sources[j].point.y;
			this.#vertexCataloguePosition[positionIndex+2] = sources[j].point.z;
			
			// source selected on index 3
			this.#vertexCataloguePosition[positionIndex+3] = 0.0;
			
			// source size (not used for the moment) on index 4
			this.#vertexCataloguePosition[positionIndex+4] = 8.0;
			
			positionIndex += Catalogue.ELEM_SIZE;
			
		}
		this.#gl.bufferData(this.#gl.ARRAY_BUFFER, this.#vertexCataloguePosition, this.#gl.STATIC_DRAW);

		
		/* 
		 * check https://stackoverflow.com/questions/27714014/3d-point-on-circumference-of-a-circle-with-a-center-radius-and-normal-vector
		 * for a strategy to create circle on the surface of the sphere instead of creating the circle-point in the fragment shader. This 
		 * should solve the issue of having the circles always parallel to the screen
		 */ 
		
		/*
		 * https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html
		 */

	}
	
	
	
	
	checkSelection (in_mouseCoords) {
		var sources = this.#sources;
		var nSources = sources.length;
		var selectionIndexes = [];
		
		for(var j = 0; j < nSources; j++){
			let sourcexyz = [sources[j].point.x , sources[j].point.y , sources[j].point.z];
			
			let dist = Math.sqrt( (sourcexyz[0] - in_mouseCoords[0] )*(sourcexyz[0] - in_mouseCoords[0] ) + (sourcexyz[1] - in_mouseCoords[1] )*(sourcexyz[1] - in_mouseCoords[1] ) + (sourcexyz[2] - in_mouseCoords[2] )*(sourcexyz[2] - in_mouseCoords[2] ) );
			if (dist <= 0.004){
				
				selectionIndexes.push(j);
					
			}
		}
		return selectionIndexes;
		
	}
	
	

	
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
		

		shaderUtility.useProgram(this.#shaderProgram);
		
		this.enableShader(in_mMatrix);
		
		this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#vertexCataloguePositionBuffer);
		
		// setting source position
		this.#gl.vertexAttribPointer(this.#attribLocations.position, 3, this.#gl.FLOAT, false, Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE, 0);
		this.#gl.enableVertexAttribArray(this.#attribLocations.position);

		// setting selected sources
		this.#gl.vertexAttribPointer(this.#attribLocations.selected, 1, this.#gl.FLOAT, false, Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE, Catalogue.BYTES_X_ELEM * 3);
		this.#gl.enableVertexAttribArray(this.#attribLocations.selected);

		// TODO The size can be set with uniform or directly in the shader. setting point size (for variable catalogue)
		this.#gl.vertexAttribPointer(this.#attribLocations.pointSize, 1, this.#gl.FLOAT, false, Catalogue.BYTES_X_ELEM * Catalogue.ELEM_SIZE, Catalogue.BYTES_X_ELEM * 4);
		this.#gl.enableVertexAttribArray(this.#attribLocations.pointSize);
		
		
		// setting source shape color 
		var rgb = colorHex2RGB(this.#descriptor.shapeColor);
		var alpha = 1.0;
		rgb[3] = alpha;
		this.#gl.uniform4f(this.#attribLocations.color, rgb[0], rgb[1], rgb[2], rgb[3]);
		
		if (in_mouseCoords != null && in_mouseCoords != this.#oldMouseCoords){
			
			for (var k = 0; k < this.#selectionIndexes.length; k++){
				this.#vertexCataloguePosition[ (this.#selectionIndexes[k] * Catalogue.ELEM_SIZE) + 3] = 0.0;
				this.#vertexCataloguePosition[ (this.#selectionIndexes[k] * Catalogue.ELEM_SIZE) + 4] = 8.0;
			}	
			
			this.#selectionIndexes = this.checkSelection(in_mouseCoords);

			let selectedSources = [];
			for (var i = 0; i < this.#selectionIndexes.length; i++){
				selectedSources.push(this.#sources[this.#selectionIndexes[i]]);
			}
			
			if (this.#selectionIndexes.length > 0){
				const event = new CustomEvent('sourceSelected', { detail: selectedSources });
				window.dispatchEvent(event);	
			}
			
			for (var i = 0; i < this.#selectionIndexes.length; i++) {
				
				this.#vertexCataloguePosition[ (this.#selectionIndexes[i] * Catalogue.ELEM_SIZE) + 3] = 1.0;
				this.#vertexCataloguePosition[ (this.#selectionIndexes[i] * Catalogue.ELEM_SIZE) + 4] = 10.0;
				
			}

			this.#gl.bufferData(this.#gl.ARRAY_BUFFER, this.#vertexCataloguePosition, this.#gl.STATIC_DRAW);

		}
		

		var numItems = this.#vertexCataloguePosition.length/Catalogue.ELEM_SIZE;

		this.#gl.drawArrays(this.#gl.POINTS, 0, numItems);

		this.#oldMouseCoords = in_mouseCoords;
		
	}

	
}


export default Catalogue;