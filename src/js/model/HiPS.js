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
import {Vec3, Pointing} from 'healpixjs';
import {tileBufferSingleton} from './TileBuffer';
import {healpixGridTileDrawerSingleton} from './HealpixGridTileDrawer';
import {tileDrawerSingleton} from './TileDrawer';
import HiPSFormatSelectedEvent from '../events/HiPSFormatSelectedEvent';
import eventBus from '../events/EventBus';




class HiPS extends AbstractSkyEntity{

	constructor(in_radius, in_position, in_xRad, in_yRad, in_name, in_fovUtils){
			
		super(in_radius, in_position, in_xRad, in_yRad, in_name, in_fovUtils);
		
		this.radius = in_radius;
		this.in_gl = global.gl;
		
		
		this.updateOnFoV = true;
		
		this.pixels = [];
		this.pixelsCache = [];
		
		this.opacity = 1.00 * 100.0/100.0;
		
		this.norder = 3;
		this.prevNorder = this.norder;
		this.texturesNeedRefresh = false; // true when changing HiPS or changing nside
		
		this.healpix = global.getHealpix(this.norder);
		this.maxNPix = this.healpix.getNPix();
		
		this.URL = "http://skies.esac.esa.int/DSSColor/";
		this.maxOrder = 9;
		
		this.showSphericalGrid = false;
		this.showXyzRefCoord = false;
		this.showEquatorialGrid = false;
		
		// below this value we switch from AllSky to HEALPix geometry/texture
		this.allskyFovLimit = 50.0;
		
		this.sphericalGrid = new SphericalGrid(1.004, this.in_gl);
		
		this.xyzRefSystem = new XYZSystem(this.in_gl);
		
		this.textures = [];
		this.textures.images = [];
		
		this.below = false;
		
		this.computePixels();
		this.initShaders();
		this.initBuffer();
		this.initTexture();
	}

	initShaders () {
		var _self = this;
		var fragmentShader = getShader("hips-shader-fs");
		var vertexShader = getShader("hips-shader-vs");

		this.in_gl.attachShader(this.shaderProgram, vertexShader);
		this.in_gl.attachShader(this.shaderProgram, fragmentShader);
		this.in_gl.linkProgram(this.shaderProgram);

		if (!this.in_gl.getProgramParameter(this.shaderProgram, this.in_gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		this.in_gl.useProgram(this.shaderProgram);

		this.shaderProgram.vertexPositionAttribute = this.in_gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.in_gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

		this.shaderProgram.textureCoordAttribute = this.in_gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
		this.in_gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

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
				shader = _self.in_gl.createShader(_self.in_gl.FRAGMENT_SHADER);
			} else if (shaderScript.type == "x-shader/x-vertex") {
				shader = _self.in_gl.createShader(_self.in_gl.VERTEX_SHADER);
			} else {
				return null;
			}

			_self.in_gl.shaderSource(shader, str);
			_self.in_gl.compileShader(shader);

			if (!_self.in_gl.getShaderParameter(shader, _self.in_gl.COMPILE_STATUS)) {
				alert(_self.in_gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
		}
		
	}

	setUniformLocation (){

		this.shaderProgram.pMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uMMatrix");
		this.shaderProgram.vMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uVMatrix");
		this.shaderProgram.samplerUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uSampler0");
		this.shaderProgram.uniformVertexTextureFactor = this.in_gl.getUniformLocation(this.shaderProgram, "uFactor0");
		this.in_gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);

	}


	initBuffer () {
		
		var nPixels = this.pixels.length;
		var vertexPosition = new Float32Array(12*nPixels);

		var facesVec3Array;
		var p = [];
		
		var theta0, theta1, theta2, theta3;
		var phi0, phi1, phi2, phi3;
		
		var epsilon = 0.0;
		for (var i=0; i < nPixels; i++){			
			
			facesVec3Array = new Array();
			facesVec3Array = global.getHealpix(this.norder).getBoundariesWithStep(this.pixels[i], 1);
			
			
			if (this.radius != 1){
				// HiPS radius different from Healpix default radius 1. 
				// Mapping HEALPix coordinates to the new sphere and radius
				theta0 = Math.acos(facesVec3Array[0].z);
				theta1 = Math.acos(facesVec3Array[1].z);
				theta2 = Math.acos(facesVec3Array[2].z);
				theta3 = Math.acos(facesVec3Array[3].z);
				
				phi0 = Math.atan2(facesVec3Array[0].y, facesVec3Array[0].x);
				phi1 = Math.atan2(facesVec3Array[1].y, facesVec3Array[1].x);
				phi2 = Math.atan2(facesVec3Array[2].y, facesVec3Array[2].x);
				phi3 = Math.atan2(facesVec3Array[3].y, facesVec3Array[3].x);
				
				vertexPosition[12*i] = -this.radius * Math.sin(theta0) * Math.cos(phi0);
				vertexPosition[12*i+1] = this.radius * Math.sin(theta0) * Math.sin(phi0);
				vertexPosition[12*i+2] = this.radius * Math.cos(theta0);
				
				vertexPosition[12*i+3] = -this.radius * Math.sin(theta1) * Math.cos(phi1);
				vertexPosition[12*i+4] = this.radius * Math.sin(theta1) * Math.sin(phi1);
				vertexPosition[12*i+5] = this.radius * Math.cos(theta1);
				
				vertexPosition[12*i+6] = -this.radius * Math.sin(theta2) * Math.cos(phi2);
				vertexPosition[12*i+7] = this.radius * Math.sin(theta2) * Math.sin(phi2);
				vertexPosition[12*i+8] = this.radius * Math.cos(theta2);
				
				vertexPosition[12*i+9] = -this.radius * Math.sin(theta3) * Math.cos(phi3);
				vertexPosition[12*i+10] = this.radius * Math.sin(theta3) * Math.sin(phi3);
				vertexPosition[12*i+11] = this.radius * Math.cos(theta3);
				
			}else{
				// Default Healpix radius 1
				vertexPosition[12*i] = facesVec3Array[0].x ;
				vertexPosition[12*i+1] = facesVec3Array[0].y ;
				vertexPosition[12*i+2] = facesVec3Array[0].z;
				
				vertexPosition[12*i+3] = facesVec3Array[1].x;
				vertexPosition[12*i+4] = facesVec3Array[1].y;
				vertexPosition[12*i+5] = facesVec3Array[1].z;
				
				vertexPosition[12*i+6] = facesVec3Array[2].x;
				vertexPosition[12*i+7] = facesVec3Array[2].y;
				vertexPosition[12*i+8] = facesVec3Array[2].z;
				
				vertexPosition[12*i+9] = facesVec3Array[3].x;
				vertexPosition[12*i+10] = facesVec3Array[3].y;
				vertexPosition[12*i+11] = facesVec3Array[3].z;
				
			}
		}
		
		var textureCoordinates = new Float32Array(8*nPixels);
		
		if (this.getMinFoV() >= this.allskyFovLimit){ // AllSky
	//	    if (this.fovObj.getMinFoV() >= this.allskyFovLimit){ // AllSky
			//0.037037037
			var s_step=1/27;
			//0.034482759
			var t_step=1/29;
			
			var sindex = 0;
			var tindex = 0;
			for (var i=0; i < nPixels; i++){
				// AllSky map. One map texture
				// [1, 0],[1, 1],[0, 1],[0, 0]
				textureCoordinates[8*i] = (s_step + (s_step * sindex)).toFixed(9);
				textureCoordinates[8*i+1] = (1 - (t_step + t_step * tindex)).toFixed(9);
				textureCoordinates[8*i+2] = (s_step + (s_step * sindex)).toFixed(9);
				textureCoordinates[8*i+3] = (1 - (t_step * tindex)).toFixed(9);
				textureCoordinates[8*i+4] = (s_step * sindex).toFixed(9);
				textureCoordinates[8*i+5] = (1 - (t_step * tindex)).toFixed(9);
				textureCoordinates[8*i+6] = (s_step * sindex).toFixed(9);
				textureCoordinates[8*i+7] = (1 - (t_step + t_step * tindex)).toFixed(9);
				sindex++;
				if(sindex == 27){
					tindex++;
					sindex=0;
				}
			}
		}else{
			for (var i=0; i < nPixels; i++){
				// UV mapping: 1, 0],[1, 1],[0, 1],[0, 0]
				textureCoordinates[8*i] = 1.0;
				textureCoordinates[8*i+1] = 0.0;
				textureCoordinates[8*i+2] = 1.0;
				textureCoordinates[8*i+3] = 1.0;
				textureCoordinates[8*i+4] = 0.0;
				textureCoordinates[8*i+5] = 1.0;
				textureCoordinates[8*i+6] = 0.0;
				textureCoordinates[8*i+7] = 0.0;

			}
		}		
		
		
		
		var vertexIndices = new Uint16Array(6*nPixels);
		var baseFaceIndex = 0; 
		for (var j=0; j< nPixels; j++){

			vertexIndices[6*j] = baseFaceIndex;
			vertexIndices[6*j+1] = baseFaceIndex + 1;
			vertexIndices[6*j+2] = baseFaceIndex + 2;
			
			vertexIndices[6*j+3] = baseFaceIndex;
			vertexIndices[6*j+4] = baseFaceIndex + 2;
			vertexIndices[6*j+5] = baseFaceIndex + 3;
				
			baseFaceIndex = baseFaceIndex+4;
			
		}
		
		this.vertexPositionBuffer = this.in_gl.createBuffer();
		this.in_gl.bindBuffer(this.in_gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.in_gl.bufferData(this.in_gl.ARRAY_BUFFER, vertexPosition, this.in_gl.STATIC_DRAW);
		this.vertexPositionBuffer.itemSize = 3;
		this.vertexPositionBuffer.numItems = vertexPosition.length;
		
		this.vertexTextureCoordBuffer = this.in_gl.createBuffer();
		this.in_gl.bindBuffer(this.in_gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer); 
		this.in_gl.bufferData(this.in_gl.ARRAY_BUFFER, textureCoordinates, this.in_gl.STATIC_DRAW);
		this.vertexTextureCoordBuffer.itemSize = 2;
		this.vertexTextureCoordBuffer.numItems = textureCoordinates.length;
		
		
		this.vertexIndexBuffer = this.in_gl.createBuffer();
		this.in_gl.bindBuffer(this.in_gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		this.in_gl.bufferData(this.in_gl.ELEMENT_ARRAY_BUFFER, vertexIndices, this.in_gl.STATIC_DRAW);
		this.vertexIndexBuffer.itemSize = 1;
		this.vertexIndexBuffer.numItems = vertexIndices.length;
		
	};

	initTexture (now) {
		
		
		if (this.getMinFoV() >= this.allskyFovLimit){ // AllSky
	//			if (this.fovObj.getMinFoV() >= this.allskyFovLimit){ // AllSky
			
	//			this.textures = this.in_gl.createTexture();
			
			
		
			
			
			if (this.textures.images === undefined){
				this.textures.images = [];
			}
			if (this.textures.cache === undefined){
				this.textures.cache = [];
			}
			this.textures.cache.splice(0, this.textures.cache.length);
			
			
			this.textures.images[0] = {
					tex: this.in_gl.createTexture(),
					image: new Image()
			};
			
	//			this.textures.images[0] = this.in_gl.createTexture();
			
			// binding fake black image until the real image has been loaded (https://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load/19748905#19748905) 
			this.in_gl.bindTexture(this.in_gl.TEXTURE_2D, this.textures.images[0].tex);
			this.in_gl.texImage2D(this.in_gl.TEXTURE_2D, 0, this.in_gl.RGBA, 1, 1, 0, this.in_gl.RGBA, this.in_gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])); // black
			
			this.textures.images[0].image = new Image();
			this.textures.images[0].image.setAttribute('crossorigin', 'anonymous');
			this.textures.images[0].image.setAttribute('crossOrigin', 'anonymous');
			this.textures.images[0].image.crossOrigin = "anonymous";
			this.textures.images[0].image.src = this.URL+"/Norder3/Allsky.jpg";
			
			
			var _self = this;
			this.textures.images[0].image.onload = function () {
				
				handleLoadedTexture(_self.textures.images[0], 0);
			
			};
			
	//		    this.textures.images[0].image.setAttribute('crossorigin', 'anonymous');
	//		    this.textures.images[0].image.setAttribute('crossOrigin', 'anonymous');
	//		    this.textures.images[0].image.crossOrigin = "anonymous";
	//		    this.textures.images[0].image.src = this.URL+"/Norder3/Allsky.jpg";
						
		}else{
			
			if (this.textures.images === undefined){
				this.textures.images = [];
			}
			if (this.textures.cache === undefined){
				this.textures.cache = [];
			}
			
			if (this.texturesNeedRefresh){
				console.log("[HiPS::initTexture]["+now+"] refreshing texture below AllSkyLimit");
				
				
				for (var d=0; d < this.textures.images.length; d++){
					this.in_gl.deleteTexture(this.textures.images[d].tex);
				}
				
				this.textures.images.splice(0, this.textures.images.length);
				this.textures.cache.splice(0, this.textures.cache.length);
				this.texturesNeedRefresh = false;
				
			}
			
			
			
			for (var n=0; n < this.pixels.length;n++){
				
				var texCacheIdx = this.pixelsCache.indexOf(this.pixels[n]);
				if (texCacheIdx !== -1 && this.textures.cache.length > 0){
				
					if (this.textures.cache[texCacheIdx] == undefined){
						console.log("[HiPS::initTexture] missed in texcache but present in pixelcache"+texCacheIdx);
					}else{
						console.log("[HiPS::initTexture] in texcache idx "+texCacheIdx+" pixel "+this.pixels[n]);
						this.textures.images[n] = [];
						this.textures.images[n].tex = this.textures.cache[texCacheIdx].tex;
						this.textures.images[n].image = this.textures.cache[texCacheIdx].image;	
					}
	//					this.in_gl.bindTexture(this.in_gl.TEXTURE_2D, this.textures.images[n].tex);
	//					this.in_gl.texImage2D(this.in_gl.TEXTURE_2D, 0, this.in_gl.RGBA, 1, 1, 0, this.in_gl.RGBA, this.in_gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // black
				}else{

	//					this.textures.images[n] = this.in_gl.createTexture();
					console.log("[HiPS::initTexture] new texture "+this.pixels[n]);
					this.textures.images[n] = {
							tex: this.in_gl.createTexture(),
							image: new Image()
					};
					
					// binding fake black image until the real image has been loaded (https://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load/19748905#19748905) 
					this.in_gl.bindTexture(this.in_gl.TEXTURE_2D, this.textures.images[n].tex);
					this.in_gl.texImage2D(this.in_gl.TEXTURE_2D, 0, this.in_gl.RGBA, 1, 1, 0, this.in_gl.RGBA, this.in_gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // black

					var dirNumber = Math.floor(this.pixels[n] / 10000) * 10000;
					
					this.textures.images[n].image = new Image();
					this.textures.images[n].image.n = n;
					
					var _self = this;
					this.textures.images[n].image.onload = function () {
						// last param this.n is passed just for debug
	//						handleLoadedTexture(_self.textures.images[this.n], 0, this.n);
						handleLoadedTexture(_self.textures.images[this.n], 0, this.n);
					
					};
					
					this.textures.images[n].image.setAttribute('crossorigin', 'anonymous');
					this.textures.images[n].image.setAttribute('crossOrigin', 'anonymous');
					this.textures.images[n].image.crossOrigin = "anonymous";
					this.textures.images[n].image.src = this.URL+"/Norder"+this.norder+"/Dir"+dirNumber+"/Npix"+this.pixels[n]+".jpg";
				}
				
				
	//				// TODO integrate a gl_texture cache
	//				currentObj.textures.images[n] = this.in_gl.createTexture();
	//								
	//				currentObj.textures.images[n].image = new Image();
	//				currentObj.textures.images[n].image.n = n;
	//				var dirNumber = Math.floor(currentObj.pixels[n] / 10000) * 10000;
	////				console.log("[HiPS::initTexture] n "+n);
	////				console.log("[HiPS::initTexture] pixel number  (BEFORE) "+currentObj.pixels[n]);
	//				
	//				currentObj.textures.images[n].image.onload = function () {
	//			        
	//					handleLoadedTexture(currentObj.textures.images[this.n], 0, this.n);
	//			    
	//			    };
	//			    
	//			    currentObj.textures.images[n].image.setAttribute('crossorigin', 'anonymous');
	//			    currentObj.textures.images[n].image.setAttribute('crossOrigin', 'anonymous');
	//			    currentObj.textures.images[n].image.crossOrigin = "anonymous";
	//			    currentObj.textures.images[n].image.src = currentObj.URL+"/Norder"+currentObj.norder+"/Dir"+dirNumber+"/Npix"+currentObj.pixels[n]+".jpg";
	//			    console.log("n="+n+" image.src="+currentObj.textures.images[n].image.src);
				
			}
			console.log("this.textures.images.length="+this.textures.images.length);

			this.textures.cache = this.textures.images.slice();
			
		}
		
		
		function handleLoadedTexture (textureObj, shaderSkyIndex, idx){
	//			function handleLoadedTexture (gl_texture, shaderSkyIndex, idx){
			
			_self.in_gl.activeTexture(_self.in_gl.TEXTURE0+shaderSkyIndex);
			
			_self.in_gl.pixelStorei(_self.in_gl.UNPACK_FLIP_Y_WEBGL, true);
			_self.in_gl.bindTexture(_self.in_gl.TEXTURE_2D, textureObj.tex);
			try{
	//				_self.in_gl.texImage2D(_self.in_gl.TEXTURE_2D, 0, _self.in_gl.RGBA, _self.in_gl.RGBA, _self.in_gl.UNSIGNED_BYTE, gl_texture.image);
				if(textureObj.image){
					_self.in_gl.texImage2D(_self.in_gl.TEXTURE_2D, 0, _self.in_gl.RGBA, _self.in_gl.RGBA, _self.in_gl.UNSIGNED_BYTE, textureObj.image);
				}
				
			}catch(error){
				console.error("ERRORE");
				console.error(error);
				console.error("idx: "+idx+" pixels[idx] "+_self.pixels[idx]);
				console.error(_self.pixels);
			}
			
			
			if (_self.getMinFoV() >= _self.allskyFovLimit){
				console.log("handleLoadedTexture - Full sky - no mipmap");
				// it's not a power of 2. Turn off mip and set wrapping to clamp to edge
				_self.in_gl.texParameteri(_self.in_gl.TEXTURE_2D, _self.in_gl.TEXTURE_WRAP_S, _self.in_gl.CLAMP_TO_EDGE);
				_self.in_gl.texParameteri(_self.in_gl.TEXTURE_2D, _self.in_gl.TEXTURE_WRAP_T, _self.in_gl.CLAMP_TO_EDGE);
				_self.in_gl.texParameteri(_self.in_gl.TEXTURE_2D, _self.in_gl.TEXTURE_MIN_FILTER, _self.in_gl.LINEAR);
				
			}else{
				_self.in_gl.generateMipmap(_self.in_gl.TEXTURE_2D);
				// TODO check which mipmap filtering is better. The one active or the commented alternative
				_self.in_gl.texParameteri(_self.in_gl.TEXTURE_2D, _self.in_gl.TEXTURE_MIN_FILTER, _self.in_gl.LINEAR_MIPMAP_LINEAR);
	//	DO NOT DELETE_self.in_gl.texParameteri(_self.in_gl.TEXTURE_2D, _self.in_gl.TEXTURE_MAG_FILTER, _self.in_gl.NEAREST);
	//	DO NOT DELETE_self.in_gl.texParameteri(_self.in_gl.TEXTURE_2D, _self.in_gl.TEXTURE_MIN_FILTER, _self.in_gl.NEAREST);
			}
			
			// TODO REVIEW uniformSamplerLoc[shaderSkyIndex] !!!
			_self.in_gl.uniform1i(_self.shaderProgram.samplerUniform, shaderSkyIndex);

			if (!_self.in_gl.isTexture(textureObj.tex)){
				console.log("error in texture");
			}
	//			if (!_self.in_gl.isTexture(gl_texture)){
	//		    	console.log("error in texture");
	//		    }
			
			
			_self.in_gl.bindTexture(_self.in_gl.TEXTURE_2D, null);
			
		}
	}

	/* 
	* -it takes the (0,0,sphereRadius) vector
	* -rotate it using camera rotation (inverse?)
	* -compute the central pixel numnber
	* -check if it is already into the pixels in  currentObj.pixels
	* -divides the the clip space in a grid 8x8
	* -??? multiply by 1/zoom??? -> camera translation???
	* -convert the world coords into model
	* -rotate model coords by camera rotation
	* -compute pixels numbers from rotated model coords and add them to currentObj.pixels
	*/ 
	updateVisiblePixels (now){
	//		updateVisiblePixels (
	//				in_camerObj, in_pMatrix, 
	//				in_canvas, 
	//				in_rayPickingObj, now){
		
		var gl = global.gl;
		
		
		if (this.getMinFoV() >= this.allskyFovLimit) {
			console.log("[HiPS::updateVisiblePixels] computing all pixels for AllSky");
			this.computePixels();
		}else{
			
	//			// Model point having only Z as radius
	//			var modelZPoint = [in_position[0], in_position[1], in_position[2] + currentObj.radius , 1.0];
	//			
	//			mat4.multiplyVec4(in_camerObj.getCameraMatrix(), modelZPoint, modelZPoint);
			
			var maxX = gl.canvas.width;
			var maxY = gl.canvas.height;
	//			var maxX = in_canvas.width;
	//			var maxY = in_canvas.height;

			
	//			currentObj.pixels.splice(0, currentObj.pixels.length);
			var xy = [];
			var neighbours = [];
			var intersectionWithModel = {
					"intersectionPoint": null,
					"pickedObject": null
				};
			var intersectionPoint = null;
			var currP, currPixNo;
			
			// TODO probably it would be better to use query_disc_inclusive from HEALPix 
			// against a polygon. Check my FHIPSWebGL2 project (BufferManager.js -> updateVisiblePixels)
			var i = 0;
			for (i =0; i <= maxX; i+=maxX/10){
				var j = 0;
				for (j =0; j <= maxY; j+=maxY/10){
					
					intersectionWithModel = {
							"intersectionPoint": null,
							"pickedObject": null
						};
					
					xy = [i,j];

					
					intersectionWithModel = RayPickingUtils.getIntersectionPointWithSingleModel(xy[0], xy[1], this);
					intersectionPoint = intersectionWithModel.intersectionPoint;

					if (intersectionPoint.length > 0){
						currP = new Pointing(new Vec3(intersectionPoint[0], intersectionPoint[1], intersectionPoint[2]));

						currPixNo = global.getHealpix(this.norder).ang2pix(currP);
						if (currPixNo >= 0){
							neighbours = global.getHealpix(this.norder).neighbours(currPixNo);
							if (this.pixels.indexOf(currPixNo) == -1){
								this.pixels.push(currPixNo);
							}
							var k = 0;
							for (k=0; k<neighbours.length; k++){
								if (this.pixels.indexOf(neighbours[k]) == -1){
									if(neighbours[k] >= 0){
										this.pixels.push(neighbours[k]);	
									}
								}
							}	
						}
					}
				}
			}	
		}
	}


	// TODO pass the norder. If the norder is lower than 3 (FoV greather than 32 degrees), then use 768 pixels (norder=3),
	// otherwise compute the pixels number 
	computePixels (){
		
		this.pixels.splice(0, this.pixels.length);
		for (var i=0; i < this.maxNPix;i++){
			this.pixels.push(i);
		}
		
	}



	refreshModel (in_fov, in_pan){
	//		refreshModel (in_fov, in_pan, in_camerObj, in_pMatrix, in_canvas, in_rayPickingObj){
		
		
		var camera = global.camera;
		var pMatrix = global.pMatrix;
		var gl = global.gl;
		
		var now = (new Date()).getTime();

		if (in_pan && in_fov < this.allskyFovLimit){
			
			this.texturesNeedRefresh = false;
			this.updateVisiblePixels(now);

			this.initBuffer();
			// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			// THIS ONE SHOULD GO INTO DRAW (probabky hehe)!!!!!!!
			// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			this.initTexture(now);
		}else{
			var nside, cnorder;
			
				
			if ( in_fov >= 32){
				cnorder = 3;
			}else if (in_fov < 32 && in_fov >= 16){
				cnorder = 4;
			}else if (in_fov < 16 && in_fov >= 8){
				cnorder = 5;
			}else if (in_fov < 8 && in_fov >= 4){
				cnorder = 6;
			}else if (in_fov < 4 && in_fov >= 2){
				cnorder = 7;
			}else if (in_fov < 2 && in_fov >= 1){
				cnorder = 8;
			}else if (in_fov < 1 && in_fov >= 0.5){
				cnorder = 9;
			}else if (in_fov < 0.5 && in_fov >= 0.25){
				cnorder = 10;
			}else if (in_fov < 0.25 && in_fov >= 0.125){
				cnorder = 11;
			}else if (in_fov < 0.125){
				cnorder = 12;
			}
			
			
			var needsRefresh = (this.norder != cnorder) || 
					(in_fov < this.allskyFovLimit && this.prevFoV >= this.allskyFovLimit) || 
					(in_fov > this.allskyFovLimit && this.prevFoV <= this.allskyFovLimit);
			
			if ( needsRefresh ){
				console.log("[HiPS::refreshModel] needsRefresh "+needsRefresh);
				
				this.prevNorder = this.norder;
				
				nside = Math.pow(2, cnorder);
				this.healpix = global.getHealpix(cnorder);
				this.maxNPix = this.healpix.getNPix();
				this.norder = cnorder;
				global.order = this.order;
				// TODO refresh geometry
				
				// panning and zoom in/out
				// compute visible pixels
				// update buffers
				// load textures
				this.texturesNeedRefresh = true;
				this.updateVisiblePixels(now);
	//				this.updateVisiblePixels(in_camerObj, in_pMatrix, in_canvas, now);
	//				this.updateVisiblePixels(in_camerObj, in_pMatrix, in_canvas, in_rayPickingObj, now);
				this.initBuffer();
				this.initTexture(now);
			}	
		}
		this.prevFoV = in_fov;
	}


	enableShader(pMatrix, vMatrix){
		this.in_gl.useProgram(this.shaderProgram);
		
		this.shaderProgram.pMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uPMatrix");
		this.shaderProgram.mMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uMMatrix");
		this.shaderProgram.vMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uVMatrix");
		this.shaderProgram.samplerUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uSampler0");
		this.shaderProgram.uniformVertexTextureFactor = this.in_gl.getUniformLocation(this.shaderProgram, "uFactor0");
		this.shaderProgram.sphericalGridEnabledUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uSphericalGrid");
		
		this.shaderProgram.vertexPositionAttribute = this.in_gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.shaderProgram.textureCoordAttribute = this.in_gl.getAttribLocation(this.shaderProgram, "aTextureCoord");

		this.in_gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);		
		this.in_gl.uniformMatrix4fv(this.shaderProgram.mMatrixUniform, false, this.modelMatrix);
		this.in_gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
		this.in_gl.uniformMatrix4fv(this.shaderProgram.vMatrixUniform, false, vMatrix);
		
		this.uniformVertexTextureFactorLoc = this.in_gl.getUniformLocation(this.shaderProgram, "uFactor0");
		
		this.in_gl.uniform1f(this.shaderProgram.sphericalGridEnabledUniform, 0.0);

		
	}

	draw(pMatrix, vMatrix){

		this.enableShader(pMatrix, vMatrix);
	//		this.in_gl.useProgram(this.shaderProgram);
	//		
	//		this.shaderProgram.pMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uPMatrix");
	//		this.shaderProgram.mMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uMMatrix");
	//		this.shaderProgram.vMatrixUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uVMatrix");
	//		this.shaderProgram.samplerUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uSampler0");
	//		this.shaderProgram.uniformVertexTextureFactor = this.in_gl.getUniformLocation(this.shaderProgram, "uFactor0");
	//		this.shaderProgram.sphericalGridEnabledUniform = this.in_gl.getUniformLocation(this.shaderProgram, "uSphericalGrid");
	//		
	//		this.shaderProgram.vertexPositionAttribute = this.in_gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
	//		this.shaderProgram.textureCoordAttribute = this.in_gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
	//
	//		this.in_gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, 1.0);		
	//		this.in_gl.uniformMatrix4fv(this.shaderProgram.mMatrixUniform, false, this.modelMatrix);
	//		this.in_gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, pMatrix);
	//		this.in_gl.uniformMatrix4fv(this.shaderProgram.vMatrixUniform, false, vMatrix);
	//		
	//		this.uniformVertexTextureFactorLoc = this.in_gl.getUniformLocation(this.shaderProgram, "uFactor0");
	//		
	//		this.in_gl.uniform1f(this.shaderProgram.sphericalGridEnabledUniform, 0.0);

				
		this.in_gl.bindBuffer(this.in_gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.in_gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.in_gl.FLOAT, false, 0, 0);
		
		this.in_gl.bindBuffer(this.in_gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
		this.in_gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, this.in_gl.FLOAT, false, 0, 0);
		
		this.in_gl.bindBuffer(this.in_gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		
		this.in_gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
		this.in_gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

		
		
		// 4. draw
		if (this.getMinFoV() >= this.allskyFovLimit){ // AllSky
			this.in_gl.activeTexture(this.in_gl.TEXTURE0);
	//			this.in_gl.bindTexture(this.in_gl.TEXTURE_2D, this.textures.images[0]);
			this.in_gl.bindTexture(this.in_gl.TEXTURE_2D, this.textures.images[0].tex);
			this.in_gl.uniform1f(this.shaderProgram.uniformVertexTextureFactor, this.opacity);
			
			
			if (this.below){
				console.log("Switched to AllSky on FoV "+this.getMinFoV());
				this.below = false;
			}
			
			for (var i=0;i<this.pixels.length;i++){
				this.in_gl.drawElements(this.in_gl.TRIANGLES, 6, this.in_gl.UNSIGNED_SHORT, 12*i);
			}
			
		}else{
			
			if (!this.below){
				console.log("Switched to multiple textures on FoV "+this.getMinFoV());
				this.below = true;
			}
			
			for (var i=0;i<this.pixels.length;i++){
					
				this.in_gl.activeTexture(this.in_gl.TEXTURE0);
				this.in_gl.bindTexture(this.in_gl.TEXTURE_2D, this.textures.images[i].tex);
				this.in_gl.uniform1f(this.uniformVertexTextureFactorLoc, this.opacity);
					
				this.in_gl.drawElements(this.in_gl.TRIANGLES, 6, 
						this.in_gl.UNSIGNED_SHORT, 12*i);
			}
			
		}
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
}

export default HiPS;
