"use strict";

import HealpixGridTile from './HealpixGridTile';

class HealpixGridTileBuffer {

	constructor() {
		this.tiles = new Map();
	}
	getTile(tileKey){
		if(!this.tiles.has(tileKey)){
			this.tiles.set(tileKey, new HealpixGridTile(tileKey.split("/")[0], tileKey.split("/")[1]));
		}
		let tile = this.tiles.get(tileKey);
		tile.age = 0;
		return tile;
	}

	removeTile(tileKey){
		let tile = this.tiles.get(tileKey);
		tile.destruct();
		this.tiles.delete(tileKey);
	}

	ageTiles(){ //Run every ~10 seconds
		this.tiles.forEach((tile, tileKey) => {
			if(tile.age > 6 ){ // ~1 minute
				this.removeTile(tileKey);
			} else {
				tile.age++;
			}
		})
	}
}
export const healpixGridTileBufferSingleton = new HealpixGridTileBuffer();