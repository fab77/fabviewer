"use strict";

import FoVUtils from '../utils/FoVUtils';
import Catalogue from '../model/Catalogue';
import global from '../Global';

class CatalogueRepo{
	
	#descriptorURL = null;
	#catalogueDescriptors = [];
	static #catalogues = [];
	
	
	/** 
	 * @param in_descriptorURL: URI to the JSON descriptor file
	 * @param in_addCataloguesCallback: callback with the retrieved descriptor JSON
	 */
	constructor(in_descriptorURL, in_addCataloguesCallback){
		
		this.#descriptorURL = in_descriptorURL;
		this.getDescriptorJSON(in_addCataloguesCallback);
	}
	
	getDescriptorJSON(in_addCataloguesCallback){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.#descriptorURL, true);
		xhr.responseType = 'json';
		xhr.onload = () =>  {
			var status = xhr.status;
			if (status === 200) {
				this.loadCatalogues(in_addCataloguesCallback, null, xhr.response);
			} else {
				this.loadCatalogues(in_addCataloguesCallback, status, xhr.response);
			}
		};
		xhr.send();
	}
	
	
	
	loadCatalogues(callback, err, data) {
		if (err !== null) {
			alert('Something went wrong: ' + err);
		} else {
			this.#catalogueDescriptors.push(data);
			callback(data);
		}
	}

	static get catalogues(){
		return this.#catalogues;
	}
	
	/**
	 * @param catalogue: Catalogue.js
	 */
	static addCatalogue(catalogue){
		this.#catalogues.push(catalogue);
	}
	
	static retrieveByFoV(url, descriptor, callback){
		
		var xhr = new XMLHttpRequest();
		
		var tapTable = descriptor.tapTable;
		var tapRaDeg = descriptor.raTapColumn;
	    var tapDecDeg = descriptor.decTapColumn;
	    var tapName = descriptor.nameTapColumn;
	    var name = descriptor.name;
		
		var fovPolyCartesian = FoVUtils.getFoVPolygon (global.pMatrix, global.camera, global.gl.canvas, global.defaultHips, global.rayPicker);
		var fovPolyAstro = FoVUtils.getAstroFoVPolygon(fovPolyCartesian);
		var adqlQuery = "select top 1000 * " +
				"from "+tapTable+" where " +
				"1=CONTAINS(POINT('ICRS',"+tapRaDeg+", "+tapDecDeg+"), " +
				"POLYGON('ICRS', "+fovPolyAstro+"))";
		var queryString = "tap/sync?request=doQuery&lang=ADQL&format=json&query="+encodeURI(adqlQuery);
		console.log(queryString);
		
		xhr.open('GET', url+queryString, true);
		xhr.responseType = 'json';
		xhr.onload = () =>  {
			var status = xhr.status;
			if (status === 200) {
				var metadata = xhr.response.metadata;
				var data = xhr.response.data;

				// console.log(metadata);
				console.log(data.length);
				
				var i,
				raIdx = null,
				decIdx = null,
				nameIdx = null,
				k = 0;
				
				for (i = 0; i < metadata.length; i++){
					if (metadata[i].name == tapRaDeg){
						raIdx = i;
						k += 1;
					}else if(metadata[i].name == tapDecDeg){
						decIdx = i;
						k += 1;
					}else if(metadata[i].name == tapName){
						nameIdx = i;
						k += 1;
					}
					
					if (k == 3){
						break;
					}
				}
				
				var catalogue = new Catalogue(name, metadata, raIdx, decIdx, nameIdx, descriptor);
				
				catalogue.addSources(data);
				CatalogueRepo.addCatalogue(catalogue);
				
				
				
			} else {
				alert('Something went wrong: ' + xhr.response);
			}
		};
		
		
		xhr.send();
		
	}
	
	static removeCatalogue(in_catalogueName){
		var i;
		for (i = 0; i < this.catalogues.length; i++){
			if (this.catalogues[i].name == in_catalogueName){
				this.catalogues.splice(i,1);
				break;
			}
		}
	}
}

export default CatalogueRepo;