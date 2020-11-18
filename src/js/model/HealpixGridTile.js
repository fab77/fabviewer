"use strict";

import global from '../Global';
import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';

class HealpixGridTile {

	constructor(order, ipix, radius) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		this.key = order + "/" + ipix;
		this.radius = radius != undefined ? radius : 1.2;
		this.vertexPositionIndex = 0;
		this.initBuffer();
	}

	initBuffer () {
		this.vertexPosition = new Float32Array(16*3);

		global.getHealpix(this.order).getBoundariesWithStep(this.ipix, 4).forEach(position => {
			this.addVertexPosition(position);
		});

		this.vertexPositionBuffer = this.gl.createBuffer();
		this.vertexPositionBuffer.itemSize = 3;
		this.vertexPositionBuffer.numItems = this.vertexPosition.length;


		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosition, this.gl.STATIC_DRAW);
	}

	addVertexPosition(position) {
		this.vertexPosition[this.vertexPositionIndex++] = position.x;
		this.vertexPosition[this.vertexPositionIndex++] = position.y;
		this.vertexPosition[this.vertexPositionIndex++] = position.z;
	}

	destruct(){
		this.vertexPosition = null;
		this.gl.deleteBuffer(this.vertexPositionBuffer);
		healpixGridTileBufferSingleton.removeTile(this.order, this.ipix);
	}
}
export default HealpixGridTile;