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
	_totConvexPoints;
	_npix256;
	_footprintsPointsOrder; // 1-> clockwise, -1 counter clockwise
	 

	/**
	 * 
	 * @param in_point: Point.js - center
	 * @param in_identifier: String - observation name/identifier
	 * @param in_stcs: String - STC-S representation of the footprint
	 * @param in_details: Object {"key": <key>, "value": <value>, "valueType": <valueType>, "unit": <unit>}
	 */
	constructor(in_point, in_identifier, in_stcs, in_details=[], footprintsPointsOrder){
		
		this._center = in_point;
		this._stcs = in_stcs.toUpperCase();
		this._identifier = in_identifier;
		this._details = in_details;
		this._polygons = [];
		this._totPoints = 0;
		this._totConvexPoints = 0;
		
		this._footprintsPointsOrder = footprintsPointsOrder;
		
		this.computePoints();
		this.computeConvexPoly();
		if (global.healpix4footprints){
			this._npix256 = this.computeNpix256();	
		}
		
	}
	
	
	computeConvexPoly(){
		
		this._convexPolygons = GeomUtils.computeConvexPolygons3(this._polygons, this._footprintsPointsOrder, this);
		
		for (let i = 0; i < this._convexPolygons.length; i++){
			let poly = this._convexPolygons[i];
//			this._totConvexPoints += Object.values(poly).length;
			this._totConvexPoints += poly.length;
		}
		
	}
	
	/**
	 * return: array of int representing the HEALPix pixels covering the footprint 
	 */
	// TODO wrong method name. No more fixed nside=256. nside is now defined into Global.js
	computeNpix256(){

//		this._convexPolygons = GeomUtils.computeConvexPolygons(this._polygons);
		
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
		let stcsParsed = this._stcs.replaceAll("'ICRS'", "")
			.replaceAll("ICRS", "")
			.replaceAll("J2000", "")
			.replaceAll("UNION", "")
			.replaceAll("Union", "")
			.replaceAll("TOPOCENTER", "")
			.replaceAll("\(", "")
			.replaceAll("\)", "")
			.trim().replace(/  +/g, ' ');
		
		
//		"Union ICRS TOPOCENTER ( POLYGON  3.385949514676653E+02 -9.928773297247130E+00 3.385949451763762E+02 -9.928806470393896E+00 3.385949395998741E+02 -9.928814936874511E+00 3.385949367691352E+02 -9.928818246121036E+00 3.385949273060096E+02 -9.928827392865808E+00 3.385908017223272E+02 -9.930410465354191E+00 3.384589429808335E+02 -9.980490330534581E+00 3.384588250055093E+02 -9.980533769891203E+00 3.384587968439992E+02 -9.980540744984824E+00 3.384587680292749E+02 -9.980543684876455E+00 3.384586560697683E+02 -9.980540053066386E+00 3.384586513831042E+02 -9.980538554956425E+00 3.384586308259840E+02 -9.980527798669458E+00 3.384585857880347E+02 -9.980492605473517E+00 3.384585451692236E+02 -9.980436184910520E+00 3.384580297435272E+02 -9.979321410286886E+00 3.384579427878726E+02 -9.979124145628214E+00 3.384568778427206E+02 -9.976619697077203E+00 3.384315288218414E+02 -9.912221685665882E+00 3.384315112240457E+02 -9.912173749620138E+00 3.384315120937874E+02 -9.912163020003929E+00 3.384315255458322E+02 -9.912146950944505E+00 3.384316623220830E+02 -9.912043128545278E+00 3.384326308960527E+02 -9.911580563926066E+00 3.384326753319733E+02 -9.911563401030518E+00 3.385645194533468E+02 -9.861540083389539E+00 3.385676275907875E+02 -9.860393436316468E+00 3.385676297573350E+02 -9.860392814187819E+00 3.385677498909241E+02 -9.860382892497302E+00 3.385678073640089E+02 -9.860399815237193E+00 3.385678211157114E+02 -9.860407957923087E+00 3.385678663921354E+02 -9.860463142832788E+00 3.385683156328885E+02 -9.861126220217178E+00 3.385684384385778E+02 -9.861413959310939E+00 3.385938319121649E+02 -9.925839370860212E+00 3.385949514676653E+02 -9.928773297247130E+00 POLYGON  3.387297991963861E+02 -9.876775829487734E+00 3.387297929186797E+02 -9.876809002515564E+00 3.387297873456442E+02 -9.876817468965822E+00 3.387297845162603E+02 -9.876820778200484E+00 3.387297750568799E+02 -9.876829924912462E+00 3.385982119386484E+02 -9.927600254687324E+00 3.385940863708395E+02 -9.929183327141647E+00 3.385939684135297E+02 -9.929226766577690E+00 3.385939402549122E+02 -9.929233741684074E+00 3.385939114414072E+02 -9.929236681581097E+00 3.385937994803944E+02 -9.929233049764372E+00 3.385937947931089E+02 -9.929231551651686E+00 3.385937742315281E+02 -9.929220795345028E+00 3.385937291789841E+02 -9.929185602084758E+00 3.385936885367755E+02 -9.929129181418560E+00 3.385931726488100E+02 -9.928014404756269E+00 3.385930856113604E+02 -9.927817139736844E+00 3.385920340769392E+02 -9.925349604391778E+00 3.385666429277947E+02 -9.860935403816852E+00 3.385666397477345E+02 -9.860924377887331E+00 3.385666406130539E+02 -9.860913648240306E+00 3.385666540584755E+02 -9.860897579134665E+00 3.385667907919346E+02 -9.860793756437012E+00 3.385677591752578E+02 -9.860331190488210E+00 3.385678036041048E+02 -9.860314027543318E+00 3.386993471880734E+02 -9.809584844835408E+00 3.387024548589013E+02 -9.808438200675702E+00 3.387024570251957E+02 -9.808437578548627E+00 3.387025771547475E+02 -9.808427656883325E+00 3.387026346347183E+02 -9.808444579580216E+00 3.387026483897341E+02 -9.808452722245423E+00 3.387026936886137E+02 -9.808507907014903E+00 3.387031431991924E+02 -9.809170982714594E+00 3.387032661219771E+02 -9.809458721077275E+00 3.387286930786026E+02 -9.873878750790801E+00 3.387297991963861E+02 -9.876775829487734E+00 ) "
		
		
		
		
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
	
	get totConvexPoints(){
		return this._totConvexPoints;
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
