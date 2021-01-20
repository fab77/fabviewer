"use strict";

import Tile from './Tile';

class TileBuffer {

	constructor() {
		this.tiles = {};
		this.tileCache = {};
	}

	getTile(order, ipix, format, url){
		let tileKey = order + "/" + ipix + "/" + format + "/" + url;
		if(this.tiles[tileKey] == undefined){
			if(this.tileCache[tileKey] == undefined){
				this.tiles[tileKey] = new Tile(order, ipix, format, url);
			} else {
				this.tiles[tileKey] = this.tileCache[tileKey];
				delete this.tileCache[tileKey];
			}
		}
		this.tiles[tileKey].age = 0; 
		return this.tiles[tileKey];
	}

	getTileByKey(key){
		let orderIpixFormat = key.split("/");
		if(this.tiles[key] == undefined){
			if(this.tileCache[tileKey] == undefined){
				this.tiles[key] = new Tile(orderIpixFormat[0], orderIpixFormat[1], orderIpixFormat[2], orderIpixFormat[3]);
			} else {
				this.tiles[key] = this.tileCache[key];
				delete this.tileCache[key];
			}
		}
		this.tiles[tileKey].age = 0; 
		return this.tiles[key];
	}
	
	getIfAlreadyExist(order, ipix, format, url){
		let tileKey = order + "/" + ipix + "/" + format + "/" + url;
		if(this.tiles[tileKey]){
			this.tiles[tileKey].age = 0; 
		}
		return this.tiles[tileKey];
	}

	tileRemovedFromView(tileKey){
		this.tileCache[tileKey] = this.tiles[tileKey];
		delete this.tiles[tileKey];
	}

	ageTiles(){
		Object.keys({}).forEach(tileKey => {
			if(this.tileCache[tileKey].age > 500){
				this.removeTile(tileKey);
			} else {
				this.tileCache[tileKey].age++;
			}
		})
	}

	removeTile(tileKey){
		this.tileCache[tileKey].destruct();
		delete this.tileCache[tileKey];
	}
}
export const tileBufferSingleton = new TileBuffer();