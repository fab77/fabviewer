"use strict";
/**
 * @author Fabrizio Giordano (Fab)
 */

import {vec3, vec4, mat4} from 'gl-matrix';
import global from '../Global';

class RayPickingUtils{
	
	static lastNearestVisibleObjectIdx = -1;
	
	
	constructor(){}
	
	
	static getRayFromMouse (in_mouseX, in_mouseY) {
		
		var vMatrix = global.camera.getCameraMatrix();
		var gl = global.gl;
		var pMatrix = global.pMatrix;
		
		var rect = gl.canvas.getBoundingClientRect();
		
		var canvasMX = in_mouseX - rect.left;
		var canvasMY = in_mouseY - rect.top;
		
		var x = ( 2.0 * canvasMX ) / gl.canvas.clientWidth - 1.0;
		var y = 1.0 - ( 2.0 * canvasMY ) / gl.canvas.clientHeight;
		var z = 1.0;

		// normalized device space
		var rayNds = vec3.clone([x, y, z]);
		
		// homogeneous clip space
		var rayClip = [rayNds[0], rayNds[1], -1.0, 1.0];
		
		// eye space
		var pMatrixInverse = mat4.create();
		mat4.invert(pMatrixInverse, pMatrix);

		var rayEye = [];
		RayPickingUtils.mat4MultiplyVec4(pMatrixInverse, rayClip, rayEye);
		rayEye = [rayEye[0], rayEye[1], -1.0, 0.0];
		
		// world space
		var rayWorld = [];
		var vMatrixInverse = mat4.create();
		mat4.invert(vMatrixInverse, vMatrix);
		RayPickingUtils.mat4MultiplyVec4(vMatrixInverse, rayEye, rayWorld);
				
		vec3.normalize(rayWorld, rayWorld);
		
		return rayWorld;
		
	}
	
	static mat4MultiplyVec4 = function(a, b, c) {
		c || (c = b);
		var d = b[0],
			e = b[1],
			g = b[2];
		b = b[3];
		c[0] = a[0] * d + a[4] * e + a[8] * g + a[12] * b;
		c[1] = a[1] * d + a[5] * e + a[9] * g + a[13] * b;
		c[2] = a[2] * d + a[6] * e + a[10] * g + a[14] * b;
		c[3] = a[3] * d + a[7] * e + a[11] * g + a[15] * b;
		return c
	};
	
	/*
	 * antongerdelan.net/opengl/raycasting.html
	 */
	static raySphere (rayOrigWorld, rayDirectionWorld, in_model = null){
//		static raySphere (rayOrigWorld, rayDirectionWorld, model){
		
//		console.log(rayOrigWorld);
		
		if (in_model == null){
			in_model = global.model;
		} 
		
		var intersectionDistance = -1;
		var distToMoldel = vec3.create();
		vec3.subtract(distToMoldel, rayOrigWorld, in_model.center);
		
		var b = vec3.dot(rayDirectionWorld, distToMoldel);
		
		var c = vec3.dot(distToMoldel, distToMoldel) - in_model.radius * in_model.radius;
		
		var bSquaredMinus_c = b * b - c;
		
		if (bSquaredMinus_c > 0.0){

			var t_a = -b + Math.sqrt(bSquaredMinus_c);
			var t_b = -b - Math.sqrt(bSquaredMinus_c);

			if (t_a < 0.0){
				if (t_b < 0.0){
					console.log("[RayPickingUtils::raySphere] intersection behind your shoulder");
				}
			}else if (t_b < 0.0){
				intersectionDistance = t_a;
			}else{
				intersectionDistance = ( t_a < t_b ? t_a : t_b);
			}
		}else if (bSquaredMinus_c == 0.0){
			console.log("TAKEN (tangent)!!!");
			var t = -b + Math.sqrt(bSquaredMinus_c);
			if (t < 0.0){
				console.log("[RayPickingUtils::raySphere] intersection behind your shoulder");
			}else{
				intersectionDistance = t;
			}
		}
		return intersectionDistance;
	}
	
	static getNearestVisibleObjectIdx(){
		
		return 	this.lastNearestVisibleObjectIdx;
		
	}
	
	
	
	
	
	// TODO pass only matrices
	/**
	 * 
	 * if intersection:
	 * 	returns vec3 as intersectionPoint,
	 * else
	 * 	 returns undefned as intersectionPoint,
	 */
	static getIntersectionPointWithSingleModel(in_mouseX, in_mouseY, in_modelObj = null){
		
		var camera = global.camera;
		
		if (in_modelObj == null){
			in_modelObj = global.model;
		}
		
		// TODO it has been already computed in getIntersectionPointWithModel
		var rayWorld = RayPickingUtils.getRayFromMouse(in_mouseX, in_mouseY);
		
		var intersectionDistance = RayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld, in_modelObj);
		
		var intersectionPoint = [],
		intersectionModelPoint = [];
		var intersectionPoint4d;
		var pickedObject = in_modelObj; //TODO check if this is needed
		
		if (intersectionDistance >= 0){
			
			intersectionPoint = vec3.create();
			vec3.scale(intersectionPoint, rayWorld, intersectionDistance);
			vec3.add(intersectionPoint, camera.getCameraPosition(), intersectionPoint);

			intersectionPoint4d = [intersectionPoint[0], intersectionPoint[1], intersectionPoint[2], 1.0];
			RayPickingUtils.mat4MultiplyVec4(in_modelObj.getModelMatrixInverse(), intersectionPoint4d, intersectionModelPoint);
			
			
		}
		
		return {
			"intersectionPoint": intersectionModelPoint,
			"pickedObject": pickedObject
		};
		
	}


	
	
	static getIntersectionPointWithModel(in_mouseX, in_mouseY, models){

		
		var nearestObj = RayPickingUtils.getNearestObjectOnRay(in_mouseX, in_mouseY, models);
		
		var intersectionModelPoint = [];
		var pickedObject;

		if (nearestObj.distance >= 0){
			
			var pickedObject = models[nearestObj.idx];
			
			
			intersectionModelPoint = RayPickingUtils.getIntersectionPointWithSingleModel(in_mouseX, in_mouseY, pickedObject);
			
		}
		
		return {
			"intersectionPoint": intersectionModelPoint,
			"pickedObject": pickedObject
		};
		
	}
	
	
	static getNearestObjectOnRay (in_mouseX, in_mouseY, models){
		
		var camera = global.camera;
		
		document.getElementsByTagName("body")[0].style.cursor = "auto";
		
		var intersectionDistance = -1;
		var nearestVisibleObjectIdx = -1;
		var currModel;
		var nearestVisibleIntersectionDistance = undefined;
		
		var rayWorld = RayPickingUtils.getRayFromMouse(in_mouseX, in_mouseY);

		for (var i = 0; i < models.length; i++){

			currModel = models[i];
				
			intersectionDistance = RayPickingUtils.raySphere(camera.getCameraPosition(), rayWorld, currModel);

			if (intersectionDistance >= 0){
				if (nearestVisibleIntersectionDistance === undefined || intersectionDistance < nearestVisibleIntersectionDistance){
					nearestVisibleIntersectionDistance = intersectionDistance;
					nearestVisibleObjectIdx = i;
				}
			}
		}
		if (nearestVisibleIntersectionDistance >= 0){
			if (DEBUG){
				console.log("[RayPickingUtils]::getNearestObjectOnRay nearest object name "+currModel.name);
				
			}
		}
		this.lastNearestVisibleObjectIdx = nearestVisibleObjectIdx;
		
		return {
			"idx": nearestVisibleObjectIdx,
			"distance": nearestVisibleIntersectionDistance
		};
	}
	
	
}
export default RayPickingUtils;


