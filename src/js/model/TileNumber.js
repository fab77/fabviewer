"use strict";

import global from '../Global';
import {healpixShader} from './HealpixShader';
import {textHelper} from '../utils/TextHelper';

class TileNumber {

	constructor(order, ipix) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		
		this.xyf = global.getHealpix(order).nest2xyf(ipix);
		
		this.text = this.order + "-" + this.ipix;
		this.numberOfLetters = this.text.length;
		this.drawsPerTexture = this.numberOfLetters * 3 * 2;
		textHelper.onReady(()=>{
			this.setupBuffers();
		})
	}

	setupBuffers(){
		this.setupVertexPositionBuffer();
		this.setupIndexBuffer();

		this.anythingToRender = true;
	}

	setupVertexPositionBuffer () {
		this.vertexPosition = new Float32Array(5 * 4 * this.numberOfLetters);
		this.vertexPositionBuffer = this.gl.createBuffer();
		this.populateVertexList();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);
	}

	setupIndexBuffer(){
		let index = 0;
		let indexArray = new Uint16Array(3 * 2 * this.numberOfLetters);
		for (let i = 0; i < this.numberOfLetters; i++){
			indexArray[index++] = 0 + 4 * i;
			indexArray[index++] = 1 + 4 * i;
			indexArray[index++] = 2 + 4 * i;
			indexArray[index++] = 1 + 4 * i;
			indexArray[index++] = 2 + 4 * i;
			indexArray[index++] = 3 + 4 * i;
		}

		this.vertexIndexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.STATIC_DRAW);
	}
	
	populateVertexList(){
		let points = this.getPointsForXyf(0, 0);
		
		let letterWidth = this.minus(points[2], points[1]);
		letterWidth = this.divide(letterWidth, 16);
		let letterHeight = this.minus(points[2], points[3]);
		letterHeight = this.divide(letterHeight, 16);

		let center = this.getCenter(points);
		let textPositionStart = this.minus(center, this.multiply(this.divide(letterWidth, 2) , this.numberOfLetters));

		let textPositionTop = this.add(textPositionStart, this.divide(letterHeight, 2));
		let textPositionBottom = this.minus(textPositionStart, this.divide(letterHeight, 2));
		for(let i = 0; i < this.numberOfLetters; i ++) {
			var letter = this.text[i].toLowerCase();
			const [u1, u2, v1, v2] = textHelper.getUVForLetter(letter);

			this.addVertexPosition(textPositionTop, u1, v2, i * 4);
			this.addVertexPosition(textPositionBottom, u1, v1, i * 4 + 1);
			textPositionTop = this.add(textPositionTop, letterWidth);
			textPositionBottom = this.add(textPositionBottom, letterWidth);
			this.addVertexPosition(textPositionTop, u2, v2, i * 4 + 2);
			this.addVertexPosition(textPositionBottom, u2, v1, i * 4 + 3);
		}
	}

	minus(point1, point2){
		return {x: point1.x - point2.x, y: point1.y - point2.y, z: point1.z - point2.z};
	}

	add(point1, point2){
		return {x: point1.x + point2.x, y: point1.y + point2.y, z: point1.z + point2.z};
	}

	divide(point, factor){
		return {x: point.x / factor, y: point.y / factor, z: point.z / factor };
	}

	multiply(point, factor){
		return {x: point.x * factor, y: point.y * factor, z: point.z * factor };
	}

	getCenter(points){
		let sum = {x: 0, y: 0, z: 0};
		points.forEach(point =>{
			sum = this.add(sum, point);
		});
		return this.divide(sum, points.length);
	}

	getPointsForXyf(x, y){
		return global.getHealpix(this.order).getPointsForXyf(x + this.xyf.ix, y + this.xyf.iy, 1, this.xyf.face);
	}

	addVertexPosition(position, u , v, index) {
		index *= 5;
		this.vertexPosition[index++] = position.x;
		this.vertexPosition[index++] = position.y;
		this.vertexPosition[index++] = position.z;
		this.vertexPosition[index++] = u;
		this.vertexPosition[index++] = v;
	}

	draw(pMatrix, vMatrix, modelMatrix){
		if(this.anythingToRender){
			healpixShader.useShader(pMatrix, vMatrix, modelMatrix, 1.0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, textHelper.getTexture());
			healpixShader.setPositionTextureBuffer(this.vertexPositionBuffer);
			healpixShader.setIndexBuffer(this.vertexIndexBuffer);
			this.gl.drawElements(this.gl.TRIANGLES, this.drawsPerTexture, this.gl.UNSIGNED_SHORT, 0);
		}
	}

	destruct(){
		this.gl.deleteBuffer(this.vertexPositionBuffer);
		this.gl.deleteBuffer(this.vertexIndexBuffer);
	}

}
export default TileNumber;