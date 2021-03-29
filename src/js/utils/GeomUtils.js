import Point from './Point';
import {Vec3, Pointing} from "healpixjs";

/**
 * @author Fabrizio Giordano (Fab77)
 */
class GeomUtils{
	// constructor(){}
	
	
	
	
	/**
	 * @param polygons: array of convex spherical polygons having points in clockwise order
	 * @param point2Check: point to check
	 * @return true if the point is inside one polygon, false otherwise
	 */
	static pointInsidePolygons2(polygons, point2Check){
		
		let inside = false;
		for (let k =0; k < polygons.length; k++){
			
//			let insideThisPoly = false;
			let currPoly = polygons[k];
			inside = true;
			
			for (let i =0; i < currPoly.length; i++){
				
				
				let v1 = (i == currPoly.length - 1) ? currPoly[currPoly.length - 1] : currPoly[i];
				let v2 = (i == currPoly.length - 1) ? currPoly[0] : currPoly[i+1];
				
//				if (i == currPoly.length){
//					let v1 = currPoly[currPoly.length - 1];
//					let v2 = currPoly[0];
//				}else{
//					let v1 = currPoly[i];
//					let v2 = currPoly[i+1];	
//				}
				

				let normal = v1.cross(v2);
				let scalar = normal.dot(point2Check);
				if (scalar < 0){ // because of the clockwise order
					continue;
				}else{
					inside = false;
					break;
				}
				
				/** pesudo code
				 * vv = v1 (X) v2;
				 * scal = point2Check (dot) vv;
				 * if scal > 0
				 * 		continue;
				 * else 
				 * 		inside = false;
				 * 		break;
				 *
				 */
			}
			if (inside){
				break;
			}
			
		}
		return inside;
	}
	
	/**
	 * @param polygons: array of convex polygons having with points in clockwise order
	 * @return an array of convex polygons
	 */
	static computeConvexPolygons2(polygons){
		
		// deep clone
//		let clonedpolygons = polygons.map(a => Object.assign({}, a));
		
		let clonedpolygons = [polygons.length];
		
//		let clonedpolygons = [...polygons];
		
		
		
		
		
		for (let i = 0; i < polygons.length; i++){
			
			let flip = 0;
	        let index = 0;
//	        let currPoly = clonedpolygons[i];
	        let currPoly = [...polygons[i]];
	        clonedpolygons[i] = currPoly;
	        
	        while (index < currPoly.length){
//	        while (index < Object.values(currPoly).length){
				
				
	        	let first = currPoly[index];
	            let medium = null;
	            let last = null;
	            
				if (index == currPoly.length - 1) {
					last = currPoly[1];
					medium = currPoly[0];
				} else if (index == currPoly.length - 2) {
					last = currPoly[0];
					medium = currPoly[index + 1];
				} else {
					medium = currPoly[index + 1];
					last = currPoly[index + 2];
				}
				
				let normal = first.cross(medium).norm();
				let hnd = normal.dot(last);
	        	
				
//				if (hnd >= 0){
//					console.log("removed index "+index + 1);
//					currPoly.splice(index + 1, 1);
//					index -= 1;
//					continue;
//				}
				
	        	if (index == 0) {

	        		flip = (hnd < 0.) ? -1 : 1;

	        	} else {

	        		let flipThnd = flip * hnd;
					if (flipThnd < 0) {
						currPoly.splice(index + 1, 1);
						index -= 1;
						continue;
					} 

				}

				index += 1;
	        	
	        }
			
		}
//		return Object.values(clonedpolygons);
		return clonedpolygons;
		
	}
	
	/**
	 * @param polygons: array of convex polygons having with points in clockwise order
	 * @return an array of convex polygons
	 */
	static computeConvexPolygons(polygons){
		
		// deep clone
		let clonedpolygons = polygons.map(a => Object.assign({}, a));

		
		for (let i = 0; i < polygons.length; i++){
			
			let flip = 0;
	        let index = 0;
//	        let back = false;
	        let currPoly = clonedpolygons[i];

			while (index < currPoly.length){
	        	
				
	        	let first = currPoly[index];
	            let medium = null;
	            let last = null;
	            
				if (index == currPoly.length - 1) {
					last = currPoly[1];
					medium = currPoly[0];
				} else if (index == currPoly.length - 2) {
					last = currPoly[0];
					medium = currPoly[index + 1];
				} else {
					medium = currPoly[index + 1];
					last = currPoly[index + 2];
				}
				
				let normal = first.cross(medium).norm();
				let hnd = normal.dot(last);
	        	
	        	if (index == 0) {

	        		flip = (hnd < 0.) ? -1 : 1;
//					back = false;

	        	} else {

	        		let flipThnd = flip * hnd;
					if (flipThnd > 0) {
						currPoly.splice(index + 1, 1);
//						back = true;
						index -= 1;
						continue;
					} else {
//						back = false;
					}

				}

				index += 1;
	        	
	        }
			
		}
//		return Object.values(clonedpolygons);
		return clonedpolygons;
		
	}
	
	
	/**
	 * 
	 * @param polygons:
	 *            array of polygons of Point.js
	 * @param point2Check:
	 *            Point.js
	 *            
	 * @deprecated
	 */
	static pointInsidePolygons(polygons, point2Check){
		
		for (let k =0; k < polygons.length; k++){
			let polygon = polygons[k];
			
			
			let minY = polygon[0].y;
	        let maxY = polygon[0].y;

	        for (let i = 1; i < polygon.length; i++) {
	            if (polygon[i].y < minY) {
	                minY = polygon[i].y;
	            } else if (polygon[i].y > maxY) {
	                maxY = polygon[i].y;
	            }
	        }
	        
	        let yP = point2Check.y + 2 * Math.abs(maxY);
	        if (Math.sign(maxY) != Math.sign(point2Check.y)) {
	            yP = point2Check.y + Math.abs(Math.PI / 2 - point2Check.y) + 2 * Math.abs(maxY);
	        }

	        let xS = point2Check.x;
	        let yS = point2Check.y;

	        let intersections = 0;

	        let obsP1;
	        let obsP2;
	        let mObs;
	        let qObs;
	        let t;
	        let yIntersection;

	        for (let i = 0; i < polygon.length - 1; i++) {
	            obsP1 = polygon[i];
	            obsP2 = polygon[i + 1];
	            mObs = (obsP2.y - obsP1.y) / (obsP2.x - obsP1.x);
	            qObs = (obsP2.x * obsP1.y - obsP1.x * obsP2.y) / (obsP2.x - obsP1.x);
	            t = (mObs * xS + qObs - yS) / (yP - yS);

	            if (0 <= t && t <= 1) {

	                yIntersection = t * yP + (1 - t) * yS;
	                if ((obsP1.y <= yIntersection && yIntersection <= obsP2.y)
	                        || (obsP2.y <= yIntersection && yIntersection <= obsP1.y)) {
	                    intersections += 1;
	                }

	            }

	        }
	        if (intersections % 2 != 0) {
	            return true;
	        }
	        
		}
		return false;
		
		
	}
	
  }

export default GeomUtils;