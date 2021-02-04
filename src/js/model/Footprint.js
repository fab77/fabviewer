"use strict";

import Point from '../utils/Point';
import CoordsType from '../utils/CoordsType';

class Footprint{
	
	#polygons; // array of polygons (-> array of points)
//	#points = [];	// array of Points.js
	#stcs; // STC-S Space-Time Coordinate Metadata Linear String Implementation 
	#identifier;
	#details;
	#center;
	#totPoints;
	#npix256;

	/**
	 * 
	 * @param in_point: Point.js - center
	 * @param in_identifier: String - observation name/identifier
	 * @param in_stcs: String - STC-S representation of the footprint
	 * @param in_details: Object {"key": <key>, "value": <value>, "valueType": <valueType>, "unit": <unit>}
	 */
	constructor(in_point, in_identifier, in_stcs, in_details=[]){
		
		this.#center = in_point;
		this.#stcs = in_stcs.toUpperCase();
		this.#identifier = in_identifier;
		this.#details = in_details;
		this.#polygons = [];
		this.#totPoints = 0;
		
		this.#npix256 = this.computeNpix256();
		
		this.computePoints();
	}
	
	/**
	 * return: array of int representing the HEALPix pixels covering the footprint 
	 */
	computeNpix256(){
		// TODO call healpix library with query_inclusive
		return [];
		
	};
	
	computePoints(){
		
		
		// TODO STCS parser: it should be a separated class or utility class following the standard
		let stcsParsed = this.#stcs.replaceAll("ICRS", "").replaceAll("J2000", "").replaceAll("UNION", "").replaceAll("TOPOCENTER", "").trim().replace(/  +/g, ' ');
		
		if (stcsParsed.includes("POLYGON")){
			
			let polys = stcsParsed.split("POLYGON ");
			
			for (let i = 0; i < polys.length; i++){
				let currPoly = [];
				let points = polys[i].trim().split(" ");
				if (points.length >= 2){
					for (let p = 0; p < points.length - 1; p = p+2){
						let point = new Point({
							"raDeg": points[p],
							"decDeg": points[p+1]
						}, CoordsType.ASTRO);
						currPoly.push(point);
						this.#totPoints+=1;
					}
					this.#polygons.push(currPoly);	
				}
				
			}

		} else if (stcsParsed.includes("CIRCLE")){
			let polys = stcsParsed.split("CIRCLE");
			let currPoly = [];
			console.log("STC-S CIRCLE still not handled");
		}
		

	}
	
	get totPoints(){
		return this.#totPoints;
	}

	get polygons(){
		return this.#polygons;
	}

	get identifier () {
		return this.#identifier;
	}
	
	get center(){
		return this.#center;
	}
	
	get pixels(){
		return this.#npix256;
	}
	
}

export default Footprint;