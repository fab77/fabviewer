/**
 * @author Fabrizio Giordano (Fab)
 */
import {vec3, mat4} from 'gl-matrix';

class Camera2{
	constructor(in_position){
		this.init(in_position);
	}
	
	init(in_position){
		this.cam_pos = vec3.clone(in_position); // initial camera position
		this.cam_speed = 1.0;
		
		this.vMatrix = mat4.create(); // view matrix
		this.T = mat4.create(); // translation matrix
		this.R = mat4.create(); // rotation matrix
		
//		mat4.translate(this.T, 
//				[-1.0 * this.cam_pos[0],
//				-1.0 * this.cam_pos[1],
//				-1.0 * this.cam_pos[2]]);

		//OLD gl-matrix call
		// mat4.translate(this.T, 
		// 		[this.cam_pos[0],
		// 		this.cam_pos[1],
		// 		this.cam_pos[2]]);
		mat4.translate(this.T, this.T, 
			[this.cam_pos[0],
			this.cam_pos[1],
			this.cam_pos[2]]);
	

		var T_inverse = mat4.create();
		mat4.invert(T_inverse, this.T);
		
		// TODO add fov in the Camera constructor
		this.FoV = this.previousFoV = 180.0;
		 

//		/* 
//		 * to end up with (up, fwd, rgt) = (z, -x, y) we need these rotation in order:
//		 * 1. 90 deg on the x axis => (up, fwd, rgt) = (z, y, x)
//		 * 2. 90 deg on the z axis => (up, fwd, rgt) = (z, -x, y)
//		 * Rotation matrices must be applied in opposite order 
//		 */
//		// rotation around z axis (point 2.)
//		mat4.rotate(this.R, Math.PI / 2, [0,0,1]);
//		// rotation around x axis (point 1.)
//		mat4.rotate(this.R, Math.PI / 2, [1,0,0]);
		
		var R_inverse = mat4.create();
		mat4.invert(R_inverse, this.R);
		
		
		
		mat4.multiply(this.vMatrix, T_inverse, R_inverse);
		
		// I need a vector 4
		this.fwd = vec3.clone([0.0, 0.0, -1.0]); 
		this.rgt = vec3.clone([1.0, 0.0, 0.0]);
		this.up = vec3.clone([0.0, 1.0, 0.0]);
		 
		this.move = vec3.clone([0, 0, 0]);
		
		/* 
		 * angle on from z (on the xz plane). from 0 to 180 deg
		 * theta 0 deg => z up
		 * theta 180 deg => z down
		 */
		this.theta = 0.0;
		/* 
		 * angle on from x (on the xy plane). from 0 to 360 deg
		 * phi 0 or 360 deg => x backward (out of the screen)
		 * theta 180 deg => x forward 
		 */
		this.phi = 0.0;
		
//		console.log("[Camera2::init] START -----------");
//		console.log("[Camera2::init] this.cam_pos "+this.cam_pos);
//		console.log("[Camera2::init] this.T ");
//		console.log(this.T);
//		console.log("[Camera2::init] this.R ");
//		console.log(this.R);
//		console.log("[Camera2::init] this.vMatrix ");
//		console.log(this.vMatrix);
//		console.log("[Camera2::init] END -----------");
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

		
//		console.log("[Camera2::refreshViewMatrix] START   -------");
//		console.log("[Camera::refreshViewMatrix] this.R "+this.R);
//		console.log("[Camera::refreshViewMatrix] this.T "+this.T);
		
		
		var T_inverse = mat4.create();
		var R_inverse = mat4.create();
		
		mat4.invert(T_inverse, this.T);
		
		mat4.invert(R_inverse, this.R);
		
//		console.log("[Camera::refreshViewMatrix] this.R_inverse "+ R_inverse);
//		console.log("[Camera::refreshViewMatrix] this.T_inverse "+ T_inverse);
		
		
		mat4.multiply(this.vMatrix, T_inverse, R_inverse);
		
//		console.log("[Camera2::refreshViewMatrix] END   -------");
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
		


	
}

export default Camera2;