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
	    
		
		var fovPolyCartesian = FoVUtils.getFoVPolygon (global.pMatrix, global.camera, global.gl.canvas, global.defaultHips, global.rayPicker);
		var fovPolyAstro = FoVUtils.getAstroFoVPolygon(fovPolyCartesian);
		var adqlQuery = "select top 100 * " +
			"from "+tapTable+" where " +
			"1=INTERSECTS(fov, " +
			"POLYGON('ICRS', "+fovPolyAstro+"))";
		
		console.log(tapTable);
//		var adqlQuery = "select top 2 * " +
//			"from "+tapTable+" where " +
//			// XXM OM OPTICAL
////			"observation_id = '0653290201'";
////			"observation_id = '0301340501'";
////			"observation_id = '0203040301'";
////			"observation_id = '0653290101'"; -> OK
////			"observation_id = '0851181101'";
//			"observation_id = '0017740401'";
//		//Herschel 
////			"observation_id='1342232059' AND instrument = 'PACS'";
////			"observation_id='1342232059' AND instrument = 'SPIRE'";
//		"observation_id='1342246769' AND instrument = 'PACS'";
		// AKARI
//		"obs_id='1500713_001'";
		// Chandra
//		"obs_id='6876'";
//		"obs_id='2115'";
//		var queryString = "/esasky-tap/tap/sync?request=doQuery&lang=ADQL&format=json&query="+encodeURI(adqlQuery);
		// Herschel
//		"observation_oid= '8614749'";
		var queryString = "tap/sync?request=doQuery&lang=ADQL&format=json&query="+encodeURI(adqlQuery);

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
				
				// Chandra
//				data[0][44] = "POLYGON  3.583775421190978E+02 -5.532878085799969E-01 3.583223010295075E+02 -4.254932369852927E-01 3.583223009281971E+02 -4.179399520362776E-01 3.584501719082647E+02 -3.630424903754382E-01 3.584558254491503E+02 -3.630424903754381E-01 3.584558430124443E+02 -3.630818164739545E-01 3.585110897073019E+02 -4.907859703397267E-01 3.585110900345108E+02 -4.983391727106341E-01 3.585110859694706E+02 -4.983878530931444E-01 3.583831956599834E+02 -5.532878085799960E-01 3.583775421190978E+02 -5.532878085799969E-01 "; 
//				"Union ICRS TOPOCENTER ( " +
//ok				"POLYGON  3.583992267997975E+02 -2.319634281004461E-01 3.583992665558039E+02 -2.319931740182352E-01 3.584544512409082E+02 -3.597722370519746E-01 3.584544514340570E+02 -3.673254732042641E-01 3.583268502654657E+02 -4.228465566058459E-01 3.583211967245801E+02 -4.228465566058459E-01 3.583211880032923E+02 -4.228290680812073E-01 3.582659606295063E+02 -2.950486726746581E-01 3.582659605972921E+02 -2.874953778427824E-01 3.583935732589119E+02 -2.319634281004534E-01 3.583992267997975E+02 -2.319634281004461E-01 " +
//				"POLYGON  3.583775421190978E+02 -5.532878085799969E-01 3.583223010295075E+02 -4.254932369852927E-01 3.583223009281971E+02 -4.179399520362776E-01 3.584501719082647E+02 -3.630424903754382E-01 3.584558254491503E+02 -3.630424903754381E-01 3.584558430124443E+02 -3.630818164739545E-01 3.585110897073019E+02 -4.907859703397267E-01 3.585110900345108E+02 -4.983391727106341E-01 3.585110859694706E+02 -4.983878530931444E-01 3.583831956599834E+02 -5.532878085799960E-01 3.583775421190978E+02 -5.532878085799969E-01 " +
//				"POLYGON  3.581620471866794E+02 -1.512857993830345E-01 3.582174196537006E+02 -2.791570942654556E-01 3.582174196497122E+02 -2.867103917122270E-01 3.580895252476921E+02 -3.421114857020301E-01 3.580838717068065E+02 -3.421114857020154E-01 3.580284767623734E+02 -2.142498188160141E-01 3.580284768541022E+02 -2.066965626017574E-01 3.580285208930767E+02 -2.066644983649998E-01 3.581563402294875E+02 -1.512962156827022E-01 3.581563936457938E+02 -1.512857993830360E-01 3.581620471866794E+02 -1.512857993830345E-01 " +
//				"POLYGON  3.582185680615066E+02 -2.819102212372883E-01 3.582739425205209E+02 -4.097814480147352E-01 3.582739425684758E+02 -4.173347425828517E-01 3.581460693970072E+02 -4.727264214251444E-01 3.581404158561216E+02 -4.727264214251446E-01 3.580850204397334E+02 -3.448641037508297E-01 3.580850205440123E+02 -3.373108265718328E-01 3.580850424687073E+02 -3.372883332407340E-01 3.582128832184881E+02 -2.819110667137396E-01 3.582129145206210E+02 -2.819102212372879E-01 3.582185680615066E+02 -2.819102212372883E-01 " +
//				"POLYGON  3.581970084560079E+02 -6.035272092849953E-01 3.581416671295928E+02 -4.756538954314981E-01 3.581416669096533E+02 -4.756409904594992E-01 3.581416669924134E+02 -4.680876996540023E-01 3.582695473835580E+02 -4.127390210449144E-01 3.582752009244436E+02 -4.127390210449208E-01 3.582752100758680E+02 -4.127477669044449E-01 3.583305663353735E+02 -5.406146827050100E-01 3.583305664694277E+02 -5.481679670187239E-01 3.583305539693914E+02 -5.481860843730650E-01 3.582026838690771E+02 -6.035307431444126E-01 3.581970303281915E+02 -6.035307431444161E-01 3.581970084560079E+02 -6.035272092849953E-01 " +
//				"POLYGON  3.582534711894942E+02 -7.340167144829701E-01 3.581981338439771E+02 -6.061284837753854E-01 3.581981338713626E+02 -5.985751867345832E-01 3.583260411880524E+02 -5.432215148597537E-01 3.583316947289380E+02 -5.432215148597537E-01 3.583870575252561E+02 -6.710984433846041E-01 3.583870577791674E+02 -6.786517101166776E-01 3.583870231852831E+02 -6.786793895113017E-01 3.582591686965345E+02 -7.340106873729899E-01 3.582591247303798E+02 -7.340167144829626E-01 3.582534711894942E+02 -7.340167144829701E-01 )"

				
				// Herschel
//				data[0][13] = "Polygon J2000 359.501608708444 -9.27846253536944 359.538125625012 -9.32272584761566 359.599970784102 -9.29589848266291 5.97686159401578 5.09868086562361 5.92300381099799 5.22074876527824 5.89650538768221 5.20915094991506 5.88253522328276 5.24081200375537 5.85619562540387 5.30049673229887 5.85474711567454 5.30377864570158 5.74765225844757 5.29941549154155 5.71932212340296 5.28701747383515 5.70608939969077 5.31700355780632 5.67985394245129 5.37644506879653 5.67825073083398 5.38007704410755 5.57242339180778 5.37796398891657 5.5423319379611 5.36479678783116 359.290230575132 -9.15875641483228 359.291932907036 -9.16258064538465 359.324467422998 -9.20044983286225 359.361458682317 -9.24349314215074 359.423289902408 -9.21666581775894 359.441462647444 -9.17651634379906 359.467863412968 -9.23582347285056 359.469530045672 -9.23956669189614 359.501608708444 -9.27846253536944";
				
//				data[0][13] = "Polygon J2000 " +
//						"359.501608708444 -9.27846253536944 " +
//						"359.538125625012 -9.32272584761566 " +
//						"359.599970784102 -9.29589848266291 " +
//						"5.97686159401578 5.09868086562361 " +
//						"5.92300381099799 5.22074876527824 " +
//						"5.89650538768221 5.20915094991506 " +
////						"5.88253522328276 5.24081200375537 " +
//						"5.85474711567454 5.30377864570158 " +
////						"5.74765225844757 5.29941549154155 " +
//						"5.71932212340296 5.28701747383515 " +
////						"5.70608939969077 5.31700355780632 " +
//						"5.67825073083398 5.38007704410755 " +
////						"5.57242339180778 5.37796398891657 " +
//						"5.5423319379611 5.36479678783116 " +
////						"359.290230575132 -9.15875641483228 " +
//						"359.324467422998 -9.20044983286225 " +
//						"359.361458682317 -9.24349314215074 " +
//						"359.423289902408 -9.21666581775894 " +
//						"359.441462647444 -9.17651634379906 " +
//						"359.467863412968 -9.23582347285056 "
//				+ "359.501608708444 -9.27846253536944";

				var fpCatalogue = new FPCatalogue(datasetName, metadata, raIdx, decIdx, uidIdx, stcsIdx, descriptor, FootprintsRepo.footprintsClockwiseOrder(datasetName));
				
				fpCatalogue.addFootprints(data);
				FootprintsRepo.addFootprint(fpCatalogue);

				
			} else {
				alert('Something went wrong: ' + xhr.response);
			}
		};
		
		
		xhr.send();
		
	}
	
	
	static footprintsClockwiseOrder(datasetName){
		let order = 1; // clockwise order
// || datasetName == 'Herschel'
		if(datasetName == 'AKARI' || datasetName == 'Herschel'){
			order = -1;
		}
		
		return order;
	}
	
	static removeFPCatalogue(in_footprintName){
		var i;
		for (i = 0; i < this.footprints.length; i++){
			if (this.footprints[i].datasetName == in_footprintName){
				this.footprints.splice(i,1);
				break;
			}
		}
	}
}

export default FootprintsRepo;