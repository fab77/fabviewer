"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */

import {cartesianToSpherical, sphericalToCartesian, sphericalToAstroDeg, astroDegToSpherical} from './Utils';
import CoordsType from './CoordsType';
import global from '../Global';

class Point{
	
	#x;
	#y;
	#z;
	#xyz = [];
	#raDeg;
	#decDeg;
	#raDecDeg = [];
	
	/**
	 * @param in_options: 
	 * 		{x: <x>, y: <y>, z: <z>} in case of CoordsType.CARTESIAN
	 * 		{raDeg: <raDeg>, decDeg: <decDeg>} in case of CoordsType.ASTRO
	 * 		{phiDeg: <phiDeg>, thetaDeg: <thetaDeg>} in case of CoordsType.SPHERICAL
	 * @param in_type: CoordsType
	 */
	constructor(in_options, in_type){
		
		if (in_type == CoordsType.CARTESIAN){
			
			this.#x = in_options.x;
			this.#y = in_options.y;
			this.#z = in_options.z;
			this.#xyz = [this.#x, this.#y, this.#z];
			this.#raDecDeg = this.computeAstroCoords();
			this.#raDeg = this.#raDecDeg[0];
			this.#decDeg = this.#raDecDeg[1];
			
		}else if (in_type == CoordsType.ASTRO){
			
			this.#raDeg = in_options.raDeg;
			this.#decDeg = in_options.decDeg;
			this.#raDecDeg = [this.#raDeg, this.#decDeg];
			this.#xyz = this.computeCartesianCoords();
			this.#x = this.#xyz[0];
			this.#y = this.#xyz[1];
			this.#z = this.#xyz[2];
			
		}else if (in_type == CoordsType.SPHERICAL){
			// TODO still not implemented
			console.log(CoordsType.SPHERICAL+" not implemented yet");
		}else{
			console.err("CoordsType "+in_type+" not recognised.");
		}
	}

	computeAstroCoords(){
    	var phiThetaDeg = cartesianToSpherical([this.#xyz[0], this.#xyz[1], this.#xyz[2]]);
		var raDecDeg = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta, global.insideSphere);
		var raDecDeg = [raDecDeg.ra, raDecDeg.dec];
		return raDecDeg;
    }
	
	computeCartesianCoords(){
		var phiThetaDeg = astroDegToSpherical(this.#raDeg, this.#decDeg, global.insideSphere);
		var xyz = sphericalToCartesian(phiThetaDeg.phi, phiThetaDeg.theta, 1);
		return xyz;
	}
	
	/**
	 * @return {phi: phideg, theta: thetadeg} 
	 */
	computeHealpixPhiTheta(){
		return astroDegToSpherical(this.#raDeg, this.#decDeg);
	}
	
	recomputeXYZ(){
		this.#xyz = this.computeCartesianCoords();
		this.#x = this.#xyz[0];
		this.#y = this.#xyz[1];
		this.#z = this.#xyz[2];
	}

//	constructor(in_xyz){
//		
//		this._x = in_xyz[0];
//		this._y = in_xyz[1];
//		this._z = in_xyz[2];
//		this._raDecDeg = this.computeAstroCoords(in_xyz);
//		
//	}
//	
//	computeAstroCoords(in_xyz){
//    	var phiThetaDeg = Utils.cartesianToSpherical([in_xyz[0], in_xyz[1], in_xyz[2]]);
//		var raDecDeg = Utils.sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
//		var raDecDeg = [raDecDeg.ra, raDecDeg.dec];
//		return raDecDeg;
//    }
	
	get x(){
		return this.#x;
	}
	
	get y(){
		return this.#y;
	}
	
	get z(){
		return this.#z;
	}
	
	get xyz(){
        return this.#xyz;
    }
	
    get raDeg(){
        return this.#raDeg;
    }
    
    get decDeg(){
        return this.#decDeg;
    }
    
    get raDecDeg(){
        return this.#raDecDeg;
    }
    
    toADQL(){
    	return this.#raDecDeg[0]+","+this.#raDecDeg[1];
    }
    
    toString(){
    	return "(raDeg, decDeg) => ("+this.#raDecDeg[0]+","+this.#raDecDeg[1]+") (x, y,z) => ("+this.#xyz[0]+","+this.#xyz[1]+","+this.#xyz[2]+")";
    }
}

export default Point;