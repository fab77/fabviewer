"use strict";

import Healpix from "healpixjs";
import InsideSphereSelectionChangedEvent from './events/InsideSphereSelectionChangedEvent';
import eventBus from './events/EventBus';
import HiPS from './model/HiPS';

class Global{
	
	_pMatrix;	// projection matrix (perspective)
	_mvMatrix;	// TODO model view matrix ? needed?
	_model;		// selected object
	_camera;		// the camera object
	_gl;			// GL context
	_rayPicker;	// TODO probably useless here ince all methods are static
	_hipsStack;
	// _baseUrl = "https://sky.esa.int/esasky-tap/";
	_baseUrl;
	// _baseUrl = "http://ammiappdev.esac.esa.int/esasky-tap/";
	// _baseUrl = "http://localhost:8080/esasky-sl/";
	_refnside;
	_healpix4footprints;
	_showConvexPolygons; // used in FPCatalogue to drawing convex polygons together with the original footprints (for debug)
	_defaultHips;
	
	constructor(){
		this._pMatrix = null;
		this._mvMatrix = null;
		this._model = null;
		this._camera = null;
		this._gl = null;
		this._rayPicker = null;
		this._healpix = [];
		this._order = 3;
		this._insideSphere = false;
		this._refnside = 128;
		this._baseUrl = "http://skyint.esac.esa.int/esasky-tap/";
		this._healpix4footprints = false;
		this._showConvexPolygons = false; // used in FPCatalogue to drawing convex polygons together with the original footprints (for debug)
		this._defaultHips = null;
	}

	getHealpix (order){
		if(this._healpix[order] == undefined){
			this._healpix[order] = new Healpix(Math.pow(2, order));
		}
		return this._healpix[order];
	}
	
	get pMatrix(){
		return this._pMatrix;
	}
	// IS IT USED?!?
	get mvMatrix(){
		return this._mvMatrix;
	}
	
	get model(){
		return this._model;
	}
	
	get camera(){
		return this._camera;
	}
	
	get gl(){
		return this._gl;
	}
	
	get rayPicker(){
		return this._rayPicker;
	}
	
	set pMatrix(in_pMatrix){
		this._pMatrix = in_pMatrix;
	}
	// TODO
	set mvMatrix(in_mvMatrix){
		this._mvMatrix = in_mvMatrix;
	}
	
	set model(in_model){
		this._model = in_model;
	}
	
	set camera(in_camera){
		this._camera = in_camera;
	}
	
	set gl(in_gl){
		this._gl = in_gl;
	}
	// TODO
	set rayPicker(in_rayPicker){
		this._rayPicker = in_rayPicker;
	}


	set order(in_order){
		this._order = in_order;
	}
	
	get order(){
		return this._order;
	}

	set insideSphere(in_insideSphere){
		this._insideSphere = in_insideSphere;
		eventBus.fireEvent(new InsideSphereSelectionChangedEvent(in_insideSphere));
	}
	
	get insideSphere(){
		return this._insideSphere;
	}

	get baseUrl(){
		return this._baseUrl;
	}
	
	get nsideForSelection(){
		return this._refnside;
	}

	get healpix4footprints(){
		return this._healpix4footprints;
	}
	
	get showConvexPolygons(){
		return this._showConvexPolygons;
	}
	
	get defaultHips(){
		if (this._defaultHips == null){
			this._defaultHips = new HiPS(1, [0.0, 0.0, 0.0], 
					// Math.PI / 2, 
					0, 
					// 0, "INTEGRAL-IBIS 65-100 keV", "//skies.esac.esa.int/Integral/65-100/", "fits", 3);
					// 0, "Herschel SPIRE 500 micron", "//skies.esac.esa.int/Herschel/normalized/hips500_pnorm_allsky/", "fits", 5);
					// 0, "Herschel SPIRE 500 micron", "//skies.esac.esa.int/Herschel/normalized/hips500_pnorm_allsky/", "png", 5);
					0, "DSS2 color", "//skies.esac.esa.int/DSSColor/", "jpg", 9);
		}
		return this._defaultHips;
	}
	
	
}

var global = new Global();

export default global;