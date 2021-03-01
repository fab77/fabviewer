import Point from './Point';

/**
 * @author Fabrizio Giordano (Fab77)
 */
class GeomUtils{
	// constructor(){}
	
	
	/**
	 * @param polygons:
	 *            array of polygons of Point.js
	 * @param point2Check:
	 *            Point.js
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