"use strict";

import HealpixGridTile from './HealpixGridTile';

class HealpixGridTileBuffer {

	constructor() {
		this.tiles = {};
	}
	getTile(order, ipix){
		let tileKey = order + "/" + ipix;
		if(this.tiles[tileKey] == undefined){
			this.tiles[tileKey] = new HealpixGridTile(order, ipix);
		}
		return this.tiles[tileKey];
	}

	removeTile(order, ipix){
		let tileKey = order + "/" + ipix;
		delete this.tiles[tileKey];
	}
}
export const healpixGridTileBufferSingleton = new HealpixGridTileBuffer();