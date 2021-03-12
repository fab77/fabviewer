"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */

import {cartesianToSpherical, sphericalToCartesian, sphericalToAstroDeg, astroDegToSpherical} from './Utils';
import CoordsType from './CoordsType';
import global from '../Global';

class Point{
	
	_x;
	_y;
	_z;
	_xyz = [];
	_raDeg;
	_decDeg;
	_raDecDeg = [];
	
	/**
	 * @param in_options: 
	 * 		{x: <x>, y: <y>, z: <z>} in case of CoordsType.CARTESIAN
	 * 		{raDeg: <raDeg>, decDeg: <decDeg>} in case of CoordsType.ASTRO
	 * 		{phiDeg: <phiDeg>, thetaDeg: <thetaDeg>} in case of CoordsType.SPHERICAL
	 * @param in_type: CoordsType
	 */
	constructor(in_options, in_type){
		
		if (in_type == CoordsType.CARTESIAN){
			
			this._x = in_options.x;
			this._y = in_options.y;
			this._z = in_options.z;
			this._xyz = [this._x, this._y, this._z];
			this._raDecDeg = this.computeAstroCoords();
			this._raDeg = this._raDecDeg[0];
			this._decDeg = this._raDecDeg[1];
			
		}else if (in_type == CoordsType.ASTRO){
			
			this._raDeg = in_options.raDeg;
			this._decDeg = in_options.decDeg;
			this._raDecDeg = [this._raDeg, this._decDeg];
			this._xyz = this.computeCartesianCoords();
			this._x = this._xyz[0];
			this._y = this._xyz[1];
			this._z = this._xyz[2];
			
		}else if (in_type == CoordsType.SPHERICAL){
			// TODO still not implemented
			console.log(CoordsType.SPHERICAL+" not implemented yet");
		}else{
			console.err("CoordsType "+in_type+" not recognised.");
		}
	}

	computeAstroCoords(){

    	var phiThetaDeg = cartesianToSpherical([this.#xyz[0], this.#xyz[1], this.#xyz[2]]);
		var raDecDeg = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
		var raDecDeg = [raDecDeg.ra, raDecDeg.dec];
		return raDecDeg;
    }
	
	computeCartesianCoords(){
		var phiThetaDeg = astroDegToSpherical(this.#raDeg, this.#decDeg);
		var xyz = sphericalToCartesian(phiThetaDeg.phi, phiThetaDeg.theta, 1);
		return xyz;
	}
	
	/**
	 * @return {phi: phideg, theta: thetadeg} 
	 */
	computeHealpixPhiTheta(){
		return astroDegToSpherical(this._raDeg, this._decDeg);
	}
	
	recomputeXYZ(){
		this._xyz = this.computeCartesianCoords();
		this._x = this._xyz[0];
		this._y = this._xyz[1];
		this._z = this._xyz[2];
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
		return this._x;
	}
	
	get y(){
		return this._y;
	}
	
	get z(){
		return this._z;
	}
	
	get xyz(){
        return this._xyz;
    }
	
    get raDeg(){
        return this._raDeg;
    }
    
    get decDeg(){
        return this._decDeg;
    }
    
    get raDecDeg(){
        return this._raDecDeg;
    }
    
    toADQL(){
    	return this._raDecDeg[0]+","+this._raDecDeg[1];
    }
    
    toString(){
    	return "(raDeg, decDeg) => ("+this._raDecDeg[0]+","+this._raDecDeg[1]+") (x, y,z) => ("+this._xyz[0]+","+this._xyz[1]+","+this._xyz[2]+")";
    }
}

export default Point;