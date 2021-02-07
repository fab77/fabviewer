"use strict";

import FoVUtils from '../utils/FoVUtils';
import FPCatalogue from '../model/FPCatalogue';
import global from '../Global';

class FootprintsRepo{
	
	#descriptorURL = null;
	#footprintDescriptors = [];
	static #footprints = [];
	
	
	/** 
	 * @param in_descriptorURL: URI to the JSON descriptor file
	 * @param in_addFootprintsCallback: callback with the retrieved descriptor JSON
	 */
	constructor(in_descriptorURL, in_addFootprintsCallback){
		
		this.#descriptorURL = in_descriptorURL;
		this.getDescriptorJSON(in_addFootprintsCallback);
	}
	
	getDescriptorJSON(in_addFootprintsCallback){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.#descriptorURL, true);
		xhr.responseType = 'json';
		xhr.onload = () =>  {
			var status = xhr.status;
			if (status === 200) {
				this.loadFootprints(in_addFootprintsCallback, null, xhr.response);
			} else {
				this.loadFootprints(in_addFootprintsCallback, status, xhr.response);
			}
		};
		xhr.send();
	}
	
	
	
	loadFootprints(callback, err, data) {
		if (err !== null) {
			alert('Something went wrong: ' + err);
		} else {
			this.#footprintDescriptors.push(data);
			callback(data);
		}
	}

	static get footprints(){
		return this.#footprints;
	}
	
	/**
	 * @param catalogue: Catalogue.js
	 */
	static addFootprint(footprint){
		this.#footprints.push(footprint);
	}
	
	
	/**
	 * @param url: TAP server base URL (E.g. sky.esa.int)
	 * @param descriptor: FPCatalogueDescriptor.js
	 * @param callback: function
	 * 
	 */
	static retrieveByFoV(url, descriptor, callback){
		
		var xhr = new XMLHttpRequest();
		
		var tapTable = descriptor.tapTable;
		var tapRaDeg = descriptor.raTapColumn;
	    var tapDecDeg = descriptor.decTapColumn;
	    var datasetName = descriptor.datasetName;
	    var uid = descriptor.uidTapColumn;
	    var stcs = descriptor.stcs;
	    
		
		var fovPolyCartesian = FoVUtils.getFoVPolygon (global.pMatrix, global.camera, global.gl.canvas, global.model, global.rayPicker);
		var fovPolyAstro = FoVUtils.getAstroFoVPolygon(fovPolyCartesian);
		var adqlQuery = "select top 10 * " +
			"from "+tapTable+" where " +
			"1=INTERSECTS(fov, " +
			"POLYGON('ICRS', "+fovPolyAstro+"))";
		
		
		
//		var adqlQuery = "select top 2 * " +
//			"from "+tapTable+" where " +
//			"observation_id = '0017740401'";
		var queryString = "/esasky-tap/tap/sync?request=doQuery&lang=ADQL&format=json&query="+encodeURI(adqlQuery);
		console.log(queryString);
		
		xhr.open('GET', url+queryString, true);
		xhr.responseType = 'json';
		xhr.onload = () =>  {
			var status = xhr.status;
			if (status === 200) {
				var metadata = xhr.response.metadata;
				var data = xhr.response.data;

				console.log(metadata);
				console.log(data);
				
				var i,
				raIdx = null,
				decIdx = null,
				uidIdx = null,
				stcsIdx = null,
				k = 0;
				
				for (i = 0; i < metadata.length; i++){
					if (metadata[i].name == tapRaDeg){
						raIdx = i;
						k += 1;
					}else if(metadata[i].name == tapDecDeg){
						decIdx = i;
						k += 1;
					}else if(metadata[i].name == uid){
						uidIdx = i;
						k += 1;
					}else if (metadata[i].name == stcs){
						stcsIdx = i;
						k += 1;
					}
					if (k == 4){
						break;
					}
				}
				
				// TODO change footprint to a more meaningfull name like footprintCatalogue
				var fpCatalogue = new FPCatalogue(datasetName, metadata, raIdx, decIdx, uidIdx, stcsIdx, descriptor);
				
				fpCatalogue.addFootprints(data);
				FootprintsRepo.addFootprint(fpCatalogue);
				
				
				
			} else {
				alert('Something went wrong: ' + xhr.response);
			}
		};
		
		
		xhr.send();
		
	}
	
	static removeFPCatalogue(in_footprintName){
		var i;
		for (i = 0; i < this.footprints.length; i++){
			if (this.footprints[i].name == in_footprintName){
				this.footprints.splice(i,1);
				break;
			}
		}
	}
}

export default FootprintsRepo;