"use strict";

import Point from '../utils/Point';
import Healpix from "healpixjs";
import {Vec3, Pointing} from "healpixjs";
import global from '../Global';

class Source{
	
	_point;
	_name;
	_details;
	_h_pix;
	/**
	 * 
	 * @param in_point:
	 *            Point.js
	 * @param in_name:
	 *            String - source name
	 * @param in_details:
	 *            Object {"key": <key>, "value": <value>, "valueType":
	 *            <valueType>, "unit": <unit>}
	 */
	constructor(in_point, in_name, in_details=[]){
		this._point = in_point;
		this._name = in_name;
		this._details = in_details;
		this.computeHealpixPixel();
	}

	computeHealpixPixel(){
		
		let healpix = new Healpix(global.nsideForSelection);
		let vec3 = new Vec3(this._point.x, this._point.y, this._point.z);
		let ptg = new Pointing(vec3, false);
		this._h_pix = healpix.ang2pix(ptg, false);
		
	}
	
	get point(){
		return this._point;
	}

	get name () {
		return this._name;
	}
	
	get healpixPixel(){
		return this._h_pix;
	}
}

export default Source;
