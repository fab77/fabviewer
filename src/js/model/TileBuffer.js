"use strict";

import Tile from './Tile';

class TileBuffer {

	constructor() {
		this.tiles = new Map();
		this.tileCache = new Map();
	}

	getTile(order, ipix, format, url){
		let tileKey = order + "/" + ipix + "/" + format + "/" + url;
		if(!this.tiles.has(tileKey)){
			if(!this.tileCache.has(tileKey)){
				this.tiles.set(tileKey, new Tile(order, ipix, format, url));
			} else {
				this.tiles.set(tileKey, this.tileCache.get(tileKey));
				this.tileCache.delete(tileKey);
			}
		}
		return this.tiles.get(tileKey);
	}

	getIfAlreadyExist(order, ipix, format, url){
		let tileKey = order + "/" + ipix + "/" + format + "/" + url;
		return this.tiles.get(tileKey);
	}

	tileRemovedFromView(tile){
		tile.age = 0;
		this.tileCache.set(tile.key, tile);
		this.tiles.delete(tile.key);
	}

	ageTiles(){ //Run every ~10 seconds
		this.tileCache.forEach((value, tileKey) => {
			if(value.age > 12 ){ // ~2 minutes
				this.removeTile(tileKey);
			} else {
				value.age++;
			}
		})
	}

	removeTile(tileKey){
		this.tileCache.get(tileKey).destruct();
		this.tileCache.delete(tileKey);
	}
}
export const tileBufferSingleton = new TileBuffer();