"use strict";

import global from '../Global';
import {healpixGridTileBufferSingleton} from './HealpixGridTileBuffer';

class HealpixGridTile {

	constructor(order, ipix, radius) {
		this.gl = global.gl;
		this.order = order;
		this.ipix = ipix;
		this.key = order + "/" + ipix;
		this.radius = radius != undefined ? radius : 1;
		this.initBuffer();
	}

	initBuffer () {
		let vertexPosition = new Float32Array(12);
		
		let facesVec3Array = global.getHealpix(this.order).getBoundaries(this.ipix);
		if (this.radius != 1){
			// HiPS radius different from Healpix default radius 1.
			// Mapping HEALPix coordinates to the new sphere and radius
			let theta0, theta1, theta2, theta3;
			let phi0, phi1, phi2, phi3;
			theta0 = Math.acos(facesVec3Array[0].z);
			theta1 = Math.acos(facesVec3Array[1].z);
			theta2 = Math.acos(facesVec3Array[2].z);
			theta3 = Math.acos(facesVec3Array[3].z);

			phi0 = Math.atan2(facesVec3Array[0].y, facesVec3Array[0].x);
			phi1 = Math.atan2(facesVec3Array[1].y, facesVec3Array[1].x);
			phi2 = Math.atan2(facesVec3Array[2].y, facesVec3Array[2].x);
			phi3 = Math.atan2(facesVec3Array[3].y, facesVec3Array[3].x);

			vertexPosition[0] = -this.radius * Math.sin(theta0) * Math.cos(phi0);
			vertexPosition[1] = this.radius * Math.sin(theta0) * Math.sin(phi0);
			vertexPosition[2] = this.radius * Math.cos(theta0);

			vertexPosition[3] = -this.radius * Math.sin(theta1) * Math.cos(phi1);
			vertexPosition[4] = this.radius * Math.sin(theta1) * Math.sin(phi1);
			vertexPosition[5] = this.radius * Math.cos(theta1);

			vertexPosition[6] = -this.radius * Math.sin(theta2) * Math.cos(phi2);
			vertexPosition[7] = this.radius * Math.sin(theta2) * Math.sin(phi2);
			vertexPosition[8] = this.radius * Math.cos(theta2);

			vertexPosition[9] = -this.radius * Math.sin(theta3) * Math.cos(phi3);
			vertexPosition[10] = this.radius * Math.sin(theta3) * Math.sin(phi3);
			vertexPosition[11] = this.radius * Math.cos(theta3);
		} else{
			vertexPosition[0] = facesVec3Array[0].x ;
			vertexPosition[1] = facesVec3Array[0].y ;
			vertexPosition[2] = facesVec3Array[0].z;

			vertexPosition[3] = facesVec3Array[1].x;
			vertexPosition[4] = facesVec3Array[1].y;
			vertexPosition[5] = facesVec3Array[1].z;

			vertexPosition[6] = facesVec3Array[2].x;
			vertexPosition[7] = facesVec3Array[2].y;
			vertexPosition[8] = facesVec3Array[2].z;

			vertexPosition[9] = facesVec3Array[3].x;
			vertexPosition[10] = facesVec3Array[3].y;
			vertexPosition[11] = facesVec3Array[3].z;
		}

		this.vertexPosition = vertexPosition;
	    this.vertexPositionBuffer = this.gl.createBuffer();
		this.vertexPositionBuffer.itemSize = 3;
		this.vertexPositionBuffer.numItems = vertexPosition.length;
	}

	destruct(){
		this.vertexPosition = null;
		this.gl.deleteBuffer(this.vertexPositionBuffer);
		healpixGridTileBufferSingleton.removeTile(this.order, this.ipix);
	}
}
export default HealpixGridTile;