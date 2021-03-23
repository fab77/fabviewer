"use strict";
/**
 * @author Fabrizio Giordano (Fab)
 */

import Healpix from "healpixjs";
import {Vec3, Pointing} from "healpixjs";
import global from '../Global';

class MouseHelper {
	
	xyz;
	raDec;
	phiTheta;
	
	/**
	 * @param xyz array [x, y, z] 
	 * @param raDecDeg [ra, dec] in degrees in equatorial J2000 
	 * @param phiThetaDeg [phi, theta] in degrees spherical coords
	 */
	constructor(in_xyz, in_raDecDeg, in_phiThetaDeg) {
		if (in_xyz != null && in_xyz !== undefined){
			this.xyz = in_xyz;
		}
		
		if (in_raDecDeg != null && in_raDecDeg !== undefined){
			this.raDec = in_raDecDeg;
		}
		
		if (in_phiThetaDeg != null && in_phiThetaDeg !== undefined){
			this.phiTheta = in_phiThetaDeg;
		}
	};
	
	
	// TODO wrong method name. No more fixed nside=256. nside is now defined into Global.js 
	computeNpix256() {
		
		if (this.xyz != null){
			let healpix256 = new Healpix(global.nsideForSelection);
			let vec3 = new Vec3(this.x, this.y, this.z);
			let pointing = new Pointing(vec3);
			let res = healpix256.ang2pix(pointing);
//			console.log(res);
			return res;
		}
		return null;
		
	};
	
	clear(){
		
		this.xyz = null;
		this.raDec = null;
		this.phiTheta = null;
	};
	
	set xyz(in_xyz){
		if (in_xyz != null && in_xyz !== undefined){
			this.xyz = in_xyz;
		}
	};
	
	set raDecDeg(in_raDecDeg){
		if (in_raDecDeg != null && in_raDecDeg !== undefined){
			this.raDec = in_raDecDeg;
		}
		
	};
	
	set phiThetaDeg(in_phiThetaDeg){
		if (in_phiThetaDeg != null && in_phiThetaDeg !== undefined){
			this.phiTheta = in_phiThetaDeg;
		}
		
	};
	
	
	
	get xyz() {
		return this.xyz;
	};
	
	get x(){
		return this.xyz[0];
	};
	
	get y(){
		return this.xyz[1];
	};
	
	get z(){
		return this.xyz[2];
	};
	
	get ra(){
		return this.raDec[0];
	};
	
	get dec(){
		return this.raDec[1];
	};
	
	get phi(){
		return this.phiTheta[0];
	};
	
	get theta(){
		return this.phiTheta[1];
	};
	
	
}

export default MouseHelper;