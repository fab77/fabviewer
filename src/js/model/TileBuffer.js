"use strict";

import Tile from './Tile';

class TileBuffer {

	constructor() {
		this.tiles = {};
	}
	getTile(order, ipix, format){
		let tileKey = order + "/" + ipix + "/" + format;
		if(this.tiles[tileKey] == undefined){
			this.tiles[tileKey] = new Tile(order, ipix, format);
		}
		return this.tiles[tileKey];
	}

	getTileByKey(key, format){
		
		let orderIpix = key.split("/");
		
		if(this.tiles[key] == undefined){
			this.tiles[key] = new Tile(orderIpix[0], orderIpix[1], format);
		}
		return this.tiles[key];
	}
	
	getIfAlreadyExist(order, ipix, format){
		let tileKey = order + "/" + ipix + "/" + format;
		return this.tiles[tileKey];
	}

	removeTile(order, ipix, format){
		let tileKey = order + "/" + ipix + "/" + format;
		delete this.tiles[tileKey];
	}
}
export const tileBufferSingleton = new TileBuffer();