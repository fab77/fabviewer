"use strict";

import {healpixShader} from './HealpixShader';
import global from '../Global';


class AllSky {

	constructor(in_gl, shaderProgram, norder, URL, radius, format){
		this.gl = in_gl;
		this.shaderProgram = shaderProgram;
		this.norder = norder;
		this.URL = URL;
		this.radius = radius;
		this.maxNPix = global.getHealpix(this.norder).getNPix();
		this.pixels = [];
		this.format = format;
		this.opacity = 1.00;

		this.isInitialized = false;
		this.updateVisiblePixels();
		this.initBuffer();
		this.initTexture();
		this.isInitialized = true;
	}
	
	updateVisiblePixels (){
		if(this.isInitialized) {return;}
		this.pixels.splice(0, this.pixels.length);
		for (var i=0; i < this.maxNPix;i++){
			this.pixels.push(i);
		}
	}

	initBuffer () {
		if(this.isInitialized) {return;}
		let nPixels = this.pixels.length;
		this.vertexPosition = new Float32Array(20*nPixels);

		//0.037037037
		let s_step=1/27;
		//0.034482759
		let t_step=1/29;
		let uindex = 0;
		let vindex = 0;

		for (let i=0; i < nPixels; i++){			
			let positionArray = global.getHealpix(this.norder).getBoundaries(this.pixels[i]);
			for(let j = 0; j < 4; j++){
				let uBase = j < 2;
				let vBase = j % 3 == 0;
				this.addVertexPosition(positionArray[j], 
					s_step * uBase + s_step * uindex, 
					1 - (t_step * vBase + t_step * vindex), 
					i * 4 + j);
			}
			uindex++;
			if(uindex == 27){
				vindex++;
				uindex=0;
			}
		}

		let vertexIndices = new Uint16Array(6*nPixels);
		let baseFaceIndex = 0; 
		for (let i=0; i< nPixels; i++){
			vertexIndices[6*i] = baseFaceIndex;
			vertexIndices[6*i+1] = baseFaceIndex + 1;
			vertexIndices[6*i+2] = baseFaceIndex + 3;
			
			vertexIndices[6*i+3] = baseFaceIndex + 1;
			vertexIndices[6*i+4] = baseFaceIndex + 2;
			vertexIndices[6*i+5] = baseFaceIndex + 3;
				
			baseFaceIndex = baseFaceIndex+4;
		}
		
		this.vertexPositionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);
		
		this.vertexIndexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, vertexIndices, this.gl.STATIC_DRAW);
	};

	addVertexPosition(position, u , v, index) {
		index *= 5;

		if(this.radius != 1){
			let theta = Math.acos(position.z);
			let phi = Math.atan2(position.y, position.x);
			
			this.vertexPosition[index++] = -this.radius * Math.sin(theta) * Math.cos(phi);
			this.vertexPosition[index++] = this.radius * Math.sin(theta) * Math.sin(phi);
			this.vertexPosition[index++] = this.radius * Math.cos(theta);
		} else {
			this.vertexPosition[index++] = position.x;
			this.vertexPosition[index++] = position.y;
			this.vertexPosition[index++] = position.z;
		}

		this.vertexPosition[index++] = u;
		this.vertexPosition[index++] = v;
	}

	initTexture () {
		if(this.isInitialized) {return;}
		this.image = new Image();
		this.texture = this.gl.createTexture();
		this.image.setAttribute('crossorigin', 'anonymous');
		this.image.src = this.URL+"/Norder3/Allsky." + this.format;
		
		this.image.onload = ()=> {
			this.isFullyLoaded = true;
			this.handleLoadedTexture();
		};
	}

	handleLoadedTexture (){
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

		this.anythingToRender = true;
	}


	draw(pMatrix, vMatrix, modelMatrix, opacity, ipixToSkip){
		if(this.anythingToRender){
			healpixShader.useShader(pMatrix, vMatrix, modelMatrix, opacity);
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
			healpixShader.setBuffers(this.vertexPositionBuffer, this.vertexIndexBuffer);

			//Speed optimization
			if(ipixToSkip.size == 0){
				for (let i = 0; i < 768; i++){
					this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 12 * i);
				}
			} else {
				for (let i = 0; i < 768; i++){
					if(!ipixToSkip.has(i)){
						this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 12 * i);
					}
				}
			}
		}
	}
}
export default AllSky;