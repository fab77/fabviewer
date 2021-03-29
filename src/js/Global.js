"use strict";

import Healpix from "healpixjs";
import InsideSphereSelectionChangedEvent from './events/InsideSphereSelectionChangedEvent';
import eventBus from './events/EventBus';

class Global{
	
	#pMatrix = null;	// projection matrix (perspective)
	#mvMatrix = null;	// TODO model view matrix ? needed?
	#model = null;		// selected object
	#camera = null;		// the camera object
	#gl = null;			// GL context
	#rayPicker = null;	// TODO probably useless here ince all methods are static
	#hipsStack = [];
	// #baseUrl = "https://sky.esa.int/esasky-tap/";
	#baseUrl = "http://skyint.esac.esa.int/esasky-tap/";
	// #baseUrl = "http://ammiappdev.esac.esa.int/esasky-tap/";
	// #baseUrl = "http://localhost:8080/esasky-sl/";
	_refnside;
	_healpix4footprints = false;
	_showConvexPolygons = true; // used in FPCatalogue to drawing convex polygons together with the original footprints (for debug)
	
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
		this._refnside = 32;
	}

	getHealpix (order){
		if(this._healpix[order] == undefined){
			this._healpix[order] = new Healpix(Math.pow(2, order));
		}
		return this._healpix[order];
	}
	
	get pMatrix(){
		return this.#pMatrix;
	}
	// IS IT USED?!?
	get mvMatrix(){
		return this.#mvMatrix;
	}
	
	get model(){
		return this.#model;
	}
	
	get camera(){
		return this.#camera;
	}
	
	get gl(){
		return this.#gl;
	}
	
	get rayPicker(){
		return this.#rayPicker;
	}
	
	set pMatrix(in_pMatrix){
		this.#pMatrix = in_pMatrix;
	}
	// TODO
	set mvMatrix(in_mvMatrix){
		this.#mvMatrix = in_mvMatrix;
	}
	
	set model(in_model){
		this.#model = in_model;
	}
	
	set camera(in_camera){
		this.#camera = in_camera;
	}
	
	set gl(in_gl){
		this.#gl = in_gl;
	}
	// TODO
	set rayPicker(in_rayPicker){
		this.#rayPicker = in_rayPicker;
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
		return this.#baseUrl;
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
	
	
	
}

var global = new Global();

export default global;