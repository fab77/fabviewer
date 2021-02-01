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

	getTileByKey(tileKey){
		let orderIpixFormat = tileKey.split("/");
		if(this.tiles[tileKey] == undefined){
			if(this.tileCache[tileKey] == undefined){
				this.tiles[tileKey] = new Tile(orderIpixFormat[0], orderIpixFormat[1], orderIpixFormat[2], orderIpixFormat[3]);
			} else {
				this.tiles[tileKey] = this.tileCache[tileKey];
				delete this.tileCache[tileKey];
			}
		}
		this.tiles[tileKey].age = 0; 
		return this.tiles[tileKey];
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
		Object.keys(this.tileCache).forEach(tileKey => {
			if(this.tileCache[tileKey].age > 60 * 60 * 2){ // ~2 minutes
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