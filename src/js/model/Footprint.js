"use strict";
/**
 * @author Fabrizio Giordano (Fab)
 */

import Point from '../utils/Point';
import CoordsType from '../utils/CoordsType';
import Healpix from "healpixjs";
import {Vec3, Pointing} from "healpixjs";
import {degToRad} from '../utils/Utils';
import GeomUtils from '../utils/GeomUtils';
import global from '../Global';


class Footprint{
	
	_polygons; // array of polygons (-> array of points)
	_convexPolygons; // array of convex polygons (-> array of points) 
	_stcs; // STC-S Space-Time Coordinate Metadata Linear String Implementation 
	_identifier;
	_details;
	_center;
	_totPoints;
	_npix256;
	
	 

	/**
	 * 
	 * @param in_point: Point.js - center
	 * @param in_identifier: String - observation name/identifier
	 * @param in_stcs: String - STC-S representation of the footprint
	 * @param in_details: Object {"key": <key>, "value": <value>, "valueType": <valueType>, "unit": <unit>}
	 */
	constructor(in_point, in_identifier, in_stcs, in_details=[]){
		
		this._center = in_point;
		this._stcs = in_stcs.toUpperCase();
		this._identifier = in_identifier;
		this._details = in_details;
		this._polygons = [];
		this._totPoints = 0;
		
		
		
		this.computePoints();
		
		this._npix256 = this.computeNpix256();
	}
	
	/**
	 * return: array of int representing the HEALPix pixels covering the footprint 
	 */
	// TODO wrong method name. No more fixed nside=256. nside is now defined into Global.js
	computeNpix256(){

		this._convexPolygons = GeomUtils.computeConvexPolygons(this._polygons);
		
		let healpix256 = new Healpix(global.nsideForSelection);

		let points = [];
		for (let i = 0; i < this._convexPolygons.length; i++){
			let poly = this._convexPolygons[i];
			for (let j = 0; j < poly.length; j++){

				let currPoint = poly[j];

				let phiTheta = currPoint.computeHealpixPhiTheta();
				let phiRad = degToRad(phiTheta.phi);
				let thetaRad = degToRad(phiTheta.theta);
				
				let pointing = new Pointing(null, false, thetaRad, phiRad);

				points.push(pointing);
			}
		}
		
		
		
		
		let rangeSet = healpix256.queryPolygonInclusive(points, 32);
//		console.log(rangeSet);
		
		
		return rangeSet.r;
		
	};

	
	computePoints(){
		
		
		// TODO STCS parser: it should be a separated class or utility class following the standard
		let stcsParsed = this._stcs.replaceAll("ICRS", "").replaceAll("J2000", "").replaceAll("UNION", "").replaceAll("TOPOCENTER", "").trim().replace(/  +/g, ' ');
		
		if (stcsParsed.includes("POLYGON")){
			
			let polys = stcsParsed.split("POLYGON ");
			
			for (let i = 1; i < polys.length; i++){
				let currPoly = [];
				let points = polys[i].trim().split(" ");
				if (points.length >= 2){
					for (let p = 0; p < points.length - 1; p = p+2){
						let point = new Point({
							"raDeg": points[p],
							"decDeg": points[p+1]
						}, CoordsType.ASTRO);
						currPoly.push(point);
						this._totPoints+=1;
					}
					this._polygons.push(currPoly);	
				}
				
			}

		} else if (stcsParsed.includes("CIRCLE")){
			let polys = stcsParsed.split("CIRCLE");
			let currPoly = [];
			console.log("STC-S CIRCLE still not handled");
		}
		

	}
	
	get totPoints(){
		return this._totPoints;
	}

	get polygons(){
		return this._polygons;
	}
	
	get convexPolygons(){
		return this._convexPolygons;
	}

	get identifier () {
		return this._identifier;
	}
	
	get center(){
		return this._center;
	}
	
	get pixels(){
		return this._npix256;
	}
	
}

export default Footprint;
