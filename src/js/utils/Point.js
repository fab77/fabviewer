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
	_xyz;
	_raDeg;
	_decDeg;
	_raDecDeg;
	
	/**
	 * @param in_options: 
	 * 		{x: <x>, y: <y>, z: <z>} in case of CoordsType.CARTESIAN
	 * 		{raDeg: <raDeg>, decDeg: <decDeg>} in case of CoordsType.ASTRO
	 * 		{phiDeg: <phiDeg>, thetaDeg: <thetaDeg>} in case of CoordsType.SPHERICAL
	 * @param in_type: CoordsType
	 */
	constructor(in_options, in_type){
		
		
		this._xyz = [];
		this._raDecDeg = [];
		
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

    	var phiThetaDeg = cartesianToSpherical([this._xyz[0], this._xyz[1], this._xyz[2]]);
		var raDecDeg = sphericalToAstroDeg(phiThetaDeg.phi, phiThetaDeg.theta);
		var raDecDeg = [raDecDeg.ra, raDecDeg.dec];
		return raDecDeg;
    }
	
	computeCartesianCoords(){
		var phiThetaDeg = astroDegToSpherical(this._raDeg, this._decDeg);
		var xyz = sphericalToCartesian(phiThetaDeg.phi, phiThetaDeg.theta, 1);
		return xyz;
	}
	
	/**
	 * @return {phi: phideg, theta: thetadeg} 
	 */
	computeHealpixPhiTheta(){
		return astroDegToSpherical(this._raDeg, this._decDeg);
	}
	
	// taken from Healpixjs->Vec3. //TODO Point and Vec3 should be unified 
	dot(v){ 
		return this.x*v.x + this.y*v.y + this.z*v.z; 
	};
	// taken from Healpixjs->Vec3. //TODO Point and Vec3 should be unified
	cross(v){ 
		return new Point({x: this.y*v.z - v.y*this.z, y: this.z*v.x - v.z*this.x, z: this.x*v.y - v.x*this.y}, CoordsType.CARTESIAN);
	};
	// taken from Healpixjs->Vec3. //TODO Point and Vec3 should be unified
	norm() {
		let d = 1./this.length();
		return new Point({x: this.x*d, y: this.y*d, z: this.z*d}, CoordsType.CARTESIAN);
	};
	// taken from Healpixjs->Vec3. //TODO Point and Vec3 should be unified
	length(){ 
		return Math.sqrt(this.lengthSquared()); 
	};
	// taken from Healpixjs->Vec3. //TODO Point and Vec3 should be unified
	lengthSquared(){ 
		return this.x*this.x + this.y*this.y + this.z*this.z; 
  	};
	
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