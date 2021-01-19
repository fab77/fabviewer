/**
 * @author Fabrizio Giordano (Fab)
 */
import {vec3, mat4} from 'gl-matrix';

import {degToRad, astroDegToSpherical, cartesianToSpherical, sphericalToCartesian} from '../utils/Utils';

class Camera3{
	constructor(in_position){
		this.init(in_position);
	}
	
	init(in_position){
		this.cam_pos = vec3.clone(in_position); // initial camera position
		this.cam_speed = 1.0;
		
		this.vMatrix = mat4.create(); // view matrix
		this.T = mat4.create(); // translation matrix
		this.R = mat4.create(); // rotation matrix
		

		mat4.translate(this.T, this.T, 
			[this.cam_pos[0],
			this.cam_pos[1],
			this.cam_pos[2]]);
	

//		var T_inverse = mat4.create();
//		mat4.invert(T_inverse, this.T);

		this.FoV = this.previousFoV = 180.0;
//		var R_inverse = mat4.create();
//		mat4.invert(R_inverse, this.R);
//		mat4.multiply(this.vMatrix, T_inverse, R_inverse);
//		
		 
		this.move = vec3.clone([0, 0, 0]);
		
		
		

		
		
		//		COMMENTED 4 TEST
//		this.refreshViewMatrix();

		
		let raDeg = 277.0;
		let decDeg = -0.2;
		
		this.goTo(raDeg, decDeg);
		
//		let ptDeg = astroDegToSpherical(raDeg, decDeg);
//		/* 
//		 * angle on from z (on the xz plane). from 0 to 180 deg
//		 * theta 0 deg => z up
//		 * theta 180 deg => z down
//		 */
////		this.theta = degToRad(ptDeg.theta);
//		this.theta = -degToRad(decDeg);
//		/* 
//		 * angle on from x (on the xy plane). from 0 to 360 deg
//		 * phi 0 or 360 deg => x backward (out of the screen)
//		 * theta 180 deg => x forward 
//		 */
////		this.phi = degToRad(ptDeg.phi);
//		this.phi = degToRad(raDeg);
//
//		this.phi = 0;
//		this.theta = 0;
//		
//		
//		// model initial phi = 0 theta 90
//		// wanted model phi 10 theta 45
//		let cameraMatrix = mat4.create();
//		
//		cameraMatrix = mat4.rotate(cameraMatrix, cameraMatrix, this.phi, [0, 1, 0]);
//		cameraMatrix = mat4.rotate(cameraMatrix, cameraMatrix, this.theta, [1, 0, 0]);
//		
////		this.R = cameraMatrix;
//		this.R = mat4.clone(cameraMatrix);
//		cameraMatrix = mat4.translate(cameraMatrix, cameraMatrix, 
//				[in_position[0],
//				in_position[1],
//				in_position[2]]);
////		this.T = [cameraMatrix];		
//		
//		let cameraPos = [
//		      cameraMatrix[12],
//		      cameraMatrix[13],
//		      cameraMatrix[14],
//		    ];
//		
//		let focusPoint = [0.0, 0.0, 0.0];
//		
//		let cameraUp = vec3.clone([0.0, 1.0, 0.0]);
//		
//		cameraMatrix = mat4.targetTo(cameraMatrix, cameraPos, focusPoint, cameraUp); 
//		
//		let viewMatrix = mat4.create();
//		viewMatrix = mat4.invert(viewMatrix, cameraMatrix);
//		this.vMatrix = viewMatrix;
//		
//		console.log(this.getCameraAngle());
		
		
	};

	
	goTo(raDeg, decDeg){
		
		let ptDeg = astroDegToSpherical(raDeg, decDeg);
		
		let xyz = sphericalToCartesian(ptDeg.phi, ptDeg.theta, 3);
		
		let cameraMatrix = mat4.create();
		
		cameraMatrix = mat4.translate(cameraMatrix, cameraMatrix, xyz);
		
		let focusPoint = [0.0, 0.0, 0.0];
		
		
		let cameraUp = vec3.clone([0.0, 1.0, 0.0]);
		let cameraPos = [
			cameraMatrix[12],
			cameraMatrix[13],
			cameraMatrix[14],
	    ];
		
		cameraMatrix = mat4.targetTo(cameraMatrix, cameraPos, focusPoint, cameraUp); 
		
		this.R = mat4.clone(cameraMatrix);
		this.R[12] = 0;
		this.R[13] = 0;
		this.R[14] = 0;
		
		
		let viewMatrix = mat4.create();
		viewMatrix = mat4.invert(viewMatrix, cameraMatrix);
		this.vMatrix = viewMatrix;
		
		console.log(this.getCameraAngle());
	};
	
	
	zoom(inertia){
		this.move = vec3.clone([0, 0, 0]);
		this.move[2] += this.cam_speed * inertia;

		if(this.cam_pos[2] < 1.005){
			this.move[2] *= this.cam_pos[2] / 100;
		} else if(this.cam_pos[2] < 1.05){
			this.move[2] *= this.cam_pos[2] / 30;
		} else if(this.cam_pos[2] < 1.3){
			this.move[2] *= this.cam_pos[2] / 5;
		}
		
		if(this.cam_pos[2] + this.move[2] <= 1.001 && inertia < 0){
			this.cam_pos[2] = 1.001;
		} else {
			this.cam_pos[2] += this.move[2];
		}
		
		var identity = mat4.create();
		mat4.translate(this.T, identity, this.cam_pos);
				
		this.refreshViewMatrix();
	}
	
	
	
	
	rotateZ(sign){
		let factorRad = sign * 0.01;
		this.phi += factorRad;
		
		var identity = mat4.create();
		mat4.rotate(this.R, this.R, factorRad, [0, 0, 1]);
		

//		console.log("[Camera2::rotateY] END ---------- ");
		
		this.refreshViewMatrix();
		
	};
	
	rotateY(sign){
		let factorRad = sign * 0.01;
		this.phi += factorRad;
		
		var identity = mat4.create();
		mat4.rotate(this.R, this.R, factorRad, [0, 1, 0]);

//		console.log("[Camera2::rotateY] END ---------- ");
		
		this.refreshViewMatrix();
		
	};
	
	rotateX(sign){
//		factorRad = sign * 0.01;
		
		
		let factorRad = sign * 0.01;
		
		this.theta += factorRad;
//		console.log("THETA "+this.theta);
		var identity = mat4.create();
		mat4.rotate(this.R, this.R, factorRad, [1, 0, 0]);
		
	    
//		console.log("[Camera2::rotateY] END ---------- ");
		
//		mat4.inverse(this.R, this.vMatrix);
		this.refreshViewMatrix();
		
	};

	
	
//	rotate(phi, theta){
//		
//		let target = vec3.clone([0.0, 0.0, 0.0]);
//		let cameraPos = this.getCameraPosition ();
//		cameraPos = vec3.rotateY(cameraPos, cameraPos, target, -phi);
//		cameraPos = vec3.rotateX(cameraPos, cameraPos, target, -theta);
//		
//		
//		
//		let cameraRight = vec3.create();
//		let cameraUp = vec3.clone([0.0, 1.0, 0.0]);
//		cameraRight = vec3.cross(cameraRight, cameraPos, cameraUp);
//		cameraRight = vec3.normalize(cameraRight,cameraRight);
//		
//		cameraUp = vec3.cross(cameraUp, cameraRight, cameraPos);
//		cameraUp = vec3.normalize(cameraUp, cameraUp);
//		
//		let cameraMatrix = mat4.create();
//		cameraMatrix = mat4.targetTo(cameraMatrix, cameraPos, target, cameraUp);
//		
//		let viewMatrix = mat4.create();
//		viewMatrix = mat4.invert(viewMatrix, cameraMatrix);
//		this.vMatrix = viewMatrix;
//
//	};


	rotate(phi, theta){
	
		
		
		var totRot = Math.sqrt(phi*phi + theta*theta);
		if(totRot == 0) {return;}

		const pos = this.getCameraPosition();
		const dist2Center = Math.sqrt(vec3.dot(pos, pos));
		const usedRot = totRot * (dist2Center - 1) / 3.0;

		mat4.rotate(this.R, this.R, -(usedRot), [theta/totRot, phi/totRot, 0]);
		
		// console.log("totRotation "+ totRot);
	    // console.log("Camera rotation matrix "+ this.R);
	    this.refreshViewMatrix();
	    
	};

	refreshViewMatrix(){
		
		var T_inverse = mat4.create();
		var R_inverse = mat4.create();
		
		mat4.invert(T_inverse, this.T);
		mat4.invert(R_inverse, this.R);
		
		mat4.multiply(this.vMatrix, T_inverse, R_inverse);

	};
	
	
	refreshFoV(currentFoV){
		
		this.previousFoV = this.FoV;
		this.FoV = currentFoV;
		
	};

	getCameraMatrix(){
		
		return this.vMatrix;
	};
	
	getCameraPosition (){
		// to be initiated into the init 
		var vMatrix_inverse = mat4.create();
		mat4.invert(vMatrix_inverse, this.vMatrix);
		return [vMatrix_inverse[12], vMatrix_inverse[13], vMatrix_inverse[14]];
	};
		
	getCameraAngle(){
		
		let ptDeg = cartesianToSpherical(this.getCameraPosition ());
		console.log("[Camera3::getCameraAngle] "+ptDeg);
		return ptDeg;
		
	};
	

	
}

export default Camera3;