"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */
import RayPickingUtils from '../utils/RayPickingUtils';
import {radToDeg} from '../utils/Utils';
import {vec3, mat4} from 'gl-matrix';
import global from '../Global';

class FoV{
	
	_minFoV;
	
	constructor(in_model){
		this.fovXDeg = 180;
		this.fovYDeg = 180;
		this.prevMinFoV = 180;
		this.model = in_model;
		this._minFoV = 180;
	}
	
	getFoV(insideSphere){
		var gl = global.gl;
		
		this.prevMinFoV = this.minFoV;
		
		// horizontal FoV 
		this.fovXDeg = this.computeAngle(0, gl.canvas.height / 2, insideSphere);
		// vertical FoV 
		this.fovYDeg = this.computeAngle(gl.canvas.width / 2, 0, insideSphere);

		this._minFoV = this.minFoV;
		
		return this;
	}
	

	computeAngle(canvasX, canvasY, insideSphere){
		
		var camera = global.camera;
		
		var rayWorld = RayPickingUtils.getRayFromMouse(canvasX, canvasY);
		
		var intersectionDistance = RayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld, this.model);
		
		if (intersectionDistance > 0){
			var intersectionPoint = vec3.create();
			vec3.scale(intersectionPoint, rayWorld, intersectionDistance);
			vec3.add(intersectionPoint, camera.getCameraPosition(), intersectionPoint);
			
			var center = this.model.center;
			
			var intersectionPoint_center_vector = vec3.create();
			vec3.subtract(intersectionPoint_center_vector, intersectionPoint, center);
			
			
			// error found!!!!! when the camera is rotated, the following vector should be rotated as well
			// because the z-axis of the world doesn't coincide with the z-axis of the camera anymore 
			var b = vec3.clone( [this.model.center[0], this.model.center[1], this.model.center[2] + this.model.radius] );
			
			var vMatrixInverse = mat4.create();
			mat4.invert(vMatrixInverse, camera.getCameraMatrix());
			
			//gl-matrix 0.x
			// mat4.multiplyVec3(vMatrixInverse, b, b);
			
			//gl-matrix 3.x
			this.mat4multiplyVec3(vMatrixInverse, b, b);
			
			
			
			var b_center_vector = vec3.create();
			vec3.subtract(b_center_vector, b, center);
			
			var scal_prod = vec3.create();
			scal_prod = vec3.dot(intersectionPoint_center_vector, b_center_vector);
			var intersectionPoint_center_vector_norm = Math.sqrt(
					intersectionPoint_center_vector[0]*intersectionPoint_center_vector[0] + 
					intersectionPoint_center_vector[1]*intersectionPoint_center_vector[1] + 
					intersectionPoint_center_vector[2]*intersectionPoint_center_vector[2]);
			var b_center_vector_norm = Math.sqrt(
					b_center_vector[0]*b_center_vector[0] + 
					b_center_vector[1]*b_center_vector[1] + 
					b_center_vector[2]*b_center_vector[2]);
			var cos_angle = scal_prod / (intersectionPoint_center_vector_norm * b_center_vector_norm);
			var angle_rad = Math.acos(cos_angle);
			var angle_deg = 2 * radToDeg(angle_rad);
			
		}else{
			angle_deg = 180;
		}
		insideSphere = insideSphere ? insideSphere : global.insideSphere;
		if(insideSphere){
			return 360 - angle_deg;
		} else {
			return angle_deg;
		}
	}
	
	get minFoV(){
		this._minFoV = (this.fovYDeg <= this.fovXDeg) ? this.fovYDeg : this.fovXDeg;
		return this._minFoV;
	}

	mat4multiplyVec3 = function(a, b, c) {
		c || (c = b);
		var d = b[0],
			e = b[1];
		b = b[2];
		c[0] = a[0] * d + a[4] * e + a[8] * b + a[12];
		c[1] = a[1] * d + a[5] * e + a[9] * b + a[13];
		c[2] = a[2] * d + a[6] * e + a[10] * b + a[14];
		return c
	};
	
}

export default FoV;

//function FoV(in_gl, in_canvas, in_model){
//	
//	var currentObj = this;
//	
//	this.init = function(){
//		currentObj.fovXDeg = 180;
//		currentObj.fovYDeg = 180;
//		currentObj.minFoV = 180;
//	};
//	
//	
//	
//
//	this.getFoV = function (in_pMatrix, in_camera){
//
//		function computeAngle(canvasX, canvasY, in_pMatrix, in_camera){
//			 
//			var rayWorld = RayPickingUtils.getRayFromMouse(canvasX, canvasY, in_pMatrix, in_camera.getCameraMatrix(), in_canvas);
//			
//			var intersectionDistance = RayPickingUtils.raySphere(in_camera.getCameraPosition(), rayWorld, in_model);
//			
//			if (intersectionDistance > 0){
//				var intersectionPoint = vec3.create();
//				vec3.scale(rayWorld, intersectionDistance, intersectionPoint);
//				vec3.add(in_camera.getCameraPosition(), intersectionPoint, intersectionPoint);
//				
//				var center = in_model.center;
//				
//				var intersectionPoint_center_vector = vec3.create();
//				vec3.subtract(intersectionPoint, center, intersectionPoint_center_vector);
//				
//				
//				// error found!!!!! when the camera is rotated, the following vector should be rotated as well
//				// because the z-axis of the world doesn't coincide with the z-axis of the camera anymore 
//				var b = vec3.create( [in_model.center[0], in_model.center[1], in_model.center[2] + in_model.radius] );
//				
//				var vMatrixInverse = mat4.create();
//				mat4.inverse(in_camera.getCameraMatrix(), vMatrixInverse);
//				
//				mat4.multiplyVec3(vMatrixInverse, b, b);
//				
//				
//				
//				var b_center_vector = vec3.create();
//				vec3.subtract(b, center, b_center_vector);
//				
//				var scal_prod = vec3.create();
//				scal_prod = vec3.dot(intersectionPoint_center_vector, b_center_vector);
//				var intersectionPoint_center_vector_norm = Math.sqrt(
//						intersectionPoint_center_vector[0]*intersectionPoint_center_vector[0] + 
//						intersectionPoint_center_vector[1]*intersectionPoint_center_vector[1] + 
//						intersectionPoint_center_vector[2]*intersectionPoint_center_vector[2]);
//				var b_center_vector_norm = Math.sqrt(
//						b_center_vector[0]*b_center_vector[0] + 
//						b_center_vector[1]*b_center_vector[1] + 
//						b_center_vector[2]*b_center_vector[2]);
//				var cos_angle = scal_prod / (intersectionPoint_center_vector_norm * b_center_vector_norm);
//				var angle_rad = Math.acos(cos_angle);
//				var angle_deg = 2 * radToDeg(angle_rad);
//				
//			}else{
//				angle_deg = 180;
//			}
//			return angle_deg;
//		}
//		
//		currentObj.prevMinFoV = currentObj.minFoV;
//		
//		// horizontal FoV 
//		currentObj.fovXDeg = computeAngle(0, in_canvas.height / 2, in_pMatrix, in_camera);
//		// vertical FoV 
//		currentObj.fovYDeg = computeAngle(in_canvas.width / 2, 0, in_pMatrix, in_camera);
//
//		currentObj.minFoV = currentObj.getMinFoV();
//		
//		return currentObj;
//
//	};
//	
//	this.getMinFoV = function(){
//		currentObj.minFoV = (currentObj.fovYDeg <= currentObj.fovXDeg) ? currentObj.fovYDeg : currentObj.fovXDeg;
//		return currentObj.minFoV;
//	};
//	
//	this.init();
//	
//	
//}
