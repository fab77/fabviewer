"use strict";

import {cartesianToSpherical, sphericalToCartesian, colorHex2RGB} from '../utils/Utils';
import {mat4} from 'gl-matrix';
import global from '../Global';
import Point from '../utils/Point';
import CoordsType from '../utils/CoordsType';
import Footprint from './Footprint';


class FPCatalogue{
	
	//static ELEM_SIZE = 5;
	static ELEM_SIZE = 3;
	static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
	
	_datasetName;
	_metadata;
	_raIdx;
	_decIdx;
	_nameIdx;
	_stcsIdx;
	_uidIdx;
	_shaderProgram;
	_gl;
	_vertexCataloguePositionBuffer;
	_indexBuffer;
	_vertexSelectionCataloguePositionBuffer;
	_footprints = [];
	_oldMouseCoords;
	_vertexCataloguePosition;
	_attribLocations = {};
	_selectionIndexes;
	_descriptor;
	_totPoints;	// Used to compute item size in the GL buffer
	_indexes;
	
	
	constructor(in_datasetName, in_metadata, in_raIdx, in_decIdx, in_uidIdx, in_stcsIdx, in_descriptor){

		this._datasetName = in_datasetName;
		this._metadata = in_metadata;
		this._raIdx = in_raIdx;
		this._decIdx = in_decIdx;
		this._uidIdx = in_uidIdx;
		this._stcsIdx = in_stcsIdx;
		
		this._descriptor = in_descriptor;
		
		this._totPoints = 0;
		
		this._gl = global.gl;
		this._shaderProgram = this._gl.createProgram();
		this._vertexCataloguePositionBuffer = this._gl.createBuffer();
		this._indexBuffer = this._gl.createBuffer();
		this._vertexSelectionCataloguePositionBuffer = this._gl.createBuffer();
		
		this._vertexCataloguePosition = [];
		
		this._selectionIndexes = [];
		
		this._oldMouseCoords = null;
		
		this._attribLocations = {
				position: 0,
				selected: 1,
				pointSize: 2,
				color: [0.0, 1.0, 0.0, 1.0]
		};
		
		this.initShaders();
		
	}
	
	
	
	
	initShaders(){
		
		var _self = this;
		var gl = this._gl;
//		var shaderProgram = this._shaderProgram;
		
		var fragmentShader = this.loadShaderFromDOM("fpcat-shader-fs");
		var vertexShader = this.loadShaderFromDOM("fpcat-shader-vs");
		
		gl.attachShader(this._shaderProgram, vertexShader);
		gl.attachShader(this._shaderProgram, fragmentShader);
		gl.linkProgram(this._shaderProgram);

		if (!gl.getProgramParameter(this._shaderProgram, gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		gl.useProgram(this._shaderProgram);

		// TODO USELESS
		this.setUniformLocation();
		
	}
	
	
	loadShaderFromDOM(shaderId) {
		var gl = this._gl;
		
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
		
		var gl = this._gl;
//		var shaderProgram = this._shaderProgram;

		this._shaderProgram.pMatrixUniform = gl.getUniformLocation(this._shaderProgram, "uPMatrix");
		this._shaderProgram.mvMatrixUniform = gl.getUniformLocation(this._shaderProgram, "uMVMatrix");

	}
	
	
	get datasetName(){
		return this._datasetName;
	}
	
	get footprints(){
		return this._footprints;
	}
	
	addFootprint(in_footprint){
		this._footprints.push(in_footprint);
	}
	
	addFootprints(in_data){
		let j,
		point,
		footprint;
		
		for ( j = 0; j < in_data.length; j++){
			
			point = new Point({
				"raDeg": in_data[j][this._raIdx],
				"decDeg": in_data[j][this._decIdx]
			}, CoordsType.ASTRO);
			
			footprint = new Footprint(point,in_data[j][this._uidIdx], in_data[j][this._stcsIdx], in_data[j]);
			this.addFootprint(footprint);
			this._totPoints += footprint.totPoints;
		}
		console.log("this._totPoints="+this._totPoints);
		console.log("this._footprints.length="+this._footprints.length);
		this.initBuffer();
		
	}
	
	
	
	
	
	
	initBuffer () {

		
		let nFootprints = this._footprints.length;
		this._indexes = new Uint16Array(this._totPoints + nFootprints - 1);
		
		let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
		
		let gl = this._gl;
			
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer);
		

		// size: total number of points among all footprints + 1 selection for each footprint + 1 line size for each footprint
//		this._vertexCataloguePosition = new Float32Array( 3 * this._totPoints + 2 * nFootprints );
//		this._vertexCataloguePosition = new Float32Array( 3 * this._totPoints + nFootprints );
		this._vertexCataloguePosition = new Float32Array( 3 * this._totPoints);
		let positionIndex = 0;
		let vIdx = 0;

		var R = 1.000000000000001;
		for(let j = 0; j < nFootprints; j++){
			
			let footprint = this._footprints[j].polygons;
			for (let polyIdx in footprint){
				for (let pointIdx in footprint[polyIdx]){
					this._vertexCataloguePosition[positionIndex] = footprint[polyIdx][pointIdx].x;
					this._vertexCataloguePosition[positionIndex+1] = footprint[polyIdx][pointIdx].y;
					this._vertexCataloguePosition[positionIndex+2] = footprint[polyIdx][pointIdx].z;
					
//					this._indexes[vIdx] = positionIndex;
					this._indexes[vIdx] = vIdx;
					
					vIdx += 1;
					positionIndex += 3;
				}
				if (polyIdx < nFootprints){
					this._indexes[vIdx] = MAX_UNSIGNED_SHORT; // TODO last one shouldn't be added
					vIdx += 1;
				}
				
//				this._vertexCataloguePosition[positionIndex] = 0.0;
//				this._vertexCataloguePosition[positionIndex+1] = 8.0;
//				positionIndex += 2;
//				positionIndex += 1;
				
			}
		}
		
		console.log("Buffer initialized");

//		glEnable ( GL_PRIMITIVE_RESTART_FIXED_INDEX ); // 65535
		
	}
	
	
	
	
//	checkSelection (in_mouseCoords) {
//		var sources = this._sources;
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

		this._shaderProgram.catUniformMVMatrixLoc = this._gl.getUniformLocation(this._shaderProgram, "uMVMatrix");
		this._shaderProgram.catUniformProjMatrixLoc = this._gl.getUniformLocation(this._shaderProgram, "uPMatrix");
		
		this._attribLocations.position  = this._gl.getAttribLocation(this._shaderProgram, 'aCatPosition');
		
		// Webgl only supports 1 px size for LINE. TODO check outlines instead https://mattdesl.svbtle.com/drawing-lines-is-hard
//		this._attribLocations.pointSize = this._gl.getAttribLocation(this._shaderProgram, 'a_pointsize');

		this._attribLocations.color = this._gl.getUniformLocation(this._shaderProgram,'u_fragcolor');
		
		var mvMatrix = mat4.create();
		mvMatrix = mat4.multiply(mvMatrix, global.camera.getCameraMatrix(), in_mMatrix);
		this._gl.uniformMatrix4fv(this._shaderProgram.catUniformMVMatrixLoc, false, mvMatrix);
		this._gl.uniformMatrix4fv(this._shaderProgram.catUniformProjMatrixLoc, false, global.pMatrix);

	}
	
	/**
	 * @param in_Matrix: model matrix the current catalogue is associated to (e.g. HiPS matrix)
	 */
	draw(in_mMatrix, in_mouseCoords){
		

		this._gl.useProgram(this._shaderProgram);
		
		this.enableShader(in_mMatrix);
		
		
		// TODO move this out of the draw method
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertexCataloguePositionBuffer);
		this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertexCataloguePosition, this._gl.STATIC_DRAW);
		
		
		// setting source position
		this._gl.vertexAttribPointer(this._attribLocations.position, FPCatalogue.ELEM_SIZE, this._gl.FLOAT, false, FPCatalogue.BYTES_X_ELEM * FPCatalogue.ELEM_SIZE, 0);
		this._gl.enableVertexAttribArray(this._attribLocations.position);

//		// TODO not needed overloading. The size can be set with uniform. setting point size 
//		this._gl.vertexAttribPointer(this._attribLocations.pointSize, 1, this._gl.FLOAT, false, FPCatalogue.BYTES_X_ELEM * FPCatalogue.ELEM_SIZE, FPCatalogue.BYTES_X_ELEM * 4);
//		this._gl.enableVertexAttribArray(this._attribLocations.pointSize);
		
		
		// setting source shape color 
//		var rgb = colorHex2RGB(this._descriptor.shapeColor);
//		var alpha = 1.0;
//		rgb[3] = alpha;
//		this._gl.uniform4f(this._attribLocations.color, rgb[0], rgb[1], rgb[2], rgb[3]);
		
		this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
		this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, this._indexes, this._gl.STATIC_DRAW);
		
		
		
		/**
		 * OPENGL code sample
		**  polygons = [ 
  		**		0,0,   10,0,  10,5, 5,10,      // polygon 1
  		**		20,20, 30,20, 30,30            // polygon 2
		**	]
		**	glEnable(GL_PRIMITIVE_RESTART);
		**	glPrimitiveRestartIndex(65535);
		**	index = [0,1,2,3,65535,4,5,6,65535,...]

		**	//bind and fill GL_ELEMENT_ARRAY_BUFFER
		**	glDrawElements(GL_LINE_LOOP, index.size, GL_UNSIGNED_INT, 0);
		**	//will draw lines `0,1 1,2 2,3 3,0 4,5 5,6 6,4`
		**/
		
		
		 
		/* 
		 * this is not needed in WebGL since it's enabled by default 
		this._gl.glEnable ( GL_PRIMITIVE_RESTART_FIXED_INDEX ); // 65535
		https://www.khronos.org/registry/webgl/specs/latest/2.0/#4.1.4
		https://github.com/KhronosGroup/glTF/issues/1142
		*/
		this._gl.drawElements (this._gl.LINE_LOOP, this._indexes.length ,this._gl.UNSIGNED_SHORT, 0);

		
		//Opengl C: glDrawElements(GL_LINE_STRIP, indices.size(), GL_UNSIGNED_INT, (GLvoid*)0);
		
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
		this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
		this._oldMouseCoords = in_mouseCoords;
		
	}

	
}


export default FPCatalogue;