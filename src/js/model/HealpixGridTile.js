"use strict";

import global from '../Global';
import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';

class HealpixGridTile {

	constructor(order, ipix) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		this.key = order + "/" + ipix;
		this.vertexPositionIndex = 0;
		this.step = 8;
		this.initBuffer();
	}

	initBuffer () {
		this.vertexPosition = new Float32Array(4 * this.step * 3);

		global.getHealpix(this.order).getBoundariesWithStep(this.ipix, this.step).forEach(position => {
			this.addVertexPosition(position);
		});

		this.vertexPositionBuffer = this.gl.createBuffer();
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