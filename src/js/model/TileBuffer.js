"use strict";

import Tile from './Tile';

class TileBuffer {

	constructor() {
		this.tiles = {};
	}

	getTile(order, ipix, format, url){
		let tileKey = order + "/" + ipix + "/" + format + "/" + url;
		if(this.tiles[tileKey] == undefined){
			this.tiles[tileKey] = new Tile(order, ipix, format, url);
		}
		return this.tiles[tileKey];
	}

	getTileByKey(key){
		let orderIpixFormat = key.split("/");
		if(this.tiles[key] == undefined){
			this.tiles[key] = new Tile(orderIpixFormat[0], orderIpixFormat[1], orderIpixFormat[2], orderIpixFormat[3]);
		}
		return this.tiles[key];
	}
	
	getIfAlreadyExist(order, ipix, format, url){
		let tileKey = order + "/" + ipix + "/" + format + "/" + url;
		return this.tiles[tileKey];
	}

	removeTile(tileKey){
		delete this.tiles[tileKey];
	}
}
export const tileBufferSingleton = new TileBuffer();