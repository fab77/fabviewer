"use strict";
/**
 * @author Henrik Norman
 */

import global from '../Global';
import RayPickingUtils from '../utils/RayPickingUtils';
import {Vec3, Pointing} from 'healpixjs';
import eventBus from '../events/EventBus';
import VisibleTilesChangedEvent from '../events/VisibleTilesChangedEvent';



class VisibleTilesManager {

	constructor(){
		this.j2000Models = [];
		this.galacticModels = [];
		this.radius = 1;
		this.order = 0;
		this.visibleTiles = new Map();
		this.visibleTilesGalactic = new Map();
		setInterval(()=> {this.updateVisibleTiles();}, 100);
	}

	registerModel(model){
		if(model.isGalacticHips){
			this.galacticModels.push(model);
			if(this.galacticModels.length == 1 && this.changedModel != undefined){
				this.updateVisibleTilesForFrame(model.isGalacticHips);
			}
		} else {
			this.j2000Models.push(model);
			if(this.j2000Models.length == 1 && this.changedModel != undefined){
				this.updateVisibleTilesForFrame(model.isGalacticHips);
			}
		}
	}

	getVisibleTilesOfHighestOrder(galactic){
		if(galactic){
			return this.visibleTilesGalactic
		}
		return this.visibleTiles;
	}

	getVisibleTilesOfOrder3(galactic){
		let visibleTiles = this.visibleTiles;
		let cache = this.order3TilesCache;
		if(galactic){
			visibleTiles = this.visibleTilesGalactic;
			cache = this.order3TilesCacheGalactic;
		}
		if(visibleTiles.size > 0 &&  visibleTiles.values().next().value.order < 3){
			return new Map();
		}
		if(cache){
			return cache;
		}

		let orderOfVisibleTiles = visibleTiles.size > 0 ? visibleTiles.values().next().value.order : this.order; 
		
		let tiles = visibleTiles;
		for(let order = orderOfVisibleTiles; order > 3; order--){
			tiles = this.getParentTiles(tiles);
		}

		if(galactic){
			this.order3TilesCacheGalactic = tiles;
		} else {
			this.order3TilesCache = tiles;
		}

		return tiles;
	}

	getParentTiles(tiles){
		let parentTiles = new Map();
		tiles.forEach((tile)=>{
			let parent = {order: tile.order - 1, ipix: (tile.ipix >> 2), key: (tile.order - 1) + "/" + (tile.ipix >> 2)};
			parentTiles.set(parent.key, parent);
		});
		return parentTiles;
	}

	refreshModel (in_fov){
		if ( in_fov >= 179){
			this.order = 0;
		}else if ( in_fov >= 62){
			this.order = 1;
		}else if ( in_fov >= 25){
			this.order = 2;
		}else if ( in_fov >= 12.5){
			this.order = 3;
		}else if (in_fov >= 6){
			this.order = 4;
		}else if (in_fov >= 3.2){
			this.order = 5;
		}else if (in_fov >= 1.6){
			this.order = 6;
		}else if (in_fov >= 0.85){
			this.order = 7;
		}else if (in_fov >= 0.42){
			this.order = 8;
		}else if (in_fov >= 0.21){
			this.order = 9;
		}else if (in_fov >= 0.12){
			this.order = 10;
		}else if (in_fov >= 0.06){
			this.order = 11;
		}else if (in_fov >= 0.03){
			this.order = 12;
		}else if (in_fov >= 0.015){
			this.order = 13;
		}else {
			this.order = 14;
		}
		
		if ( global.order != this.order && DEBUG){
			console.log("Changed order = "+ this.order);
		}
		global.order = this.order;

		this.changedModel = true;
	}

	updateVisibleTiles (){
		if(!this.changedModel){return;}
		this.changedModel = false;
		this.updateVisibleTilesForFrame(false);
		this.updateVisibleTilesForFrame(true);
	}

	updateVisibleTilesForFrame(galacticFrame){
		let visibleTiles = galacticFrame ? this.visibleTilesGalactic : this.visibleTiles;
		let previouslyVisibleKeys = new Map(visibleTiles);
		let tilesRemoved = new Map(visibleTiles);
		let tilesAdded = new Map();
		visibleTiles.clear();
		let tilesToAddInOrder = this.pollCenter(previouslyVisibleKeys, tilesRemoved, tilesAdded, galacticFrame);

		this.pollViewAndAddTiles(7, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, galacticFrame);
		
		new Map(visibleTiles).forEach((tile) =>{
			this.addNeighbours(tile.ipix, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, visibleTiles);
		});

		if(tilesRemoved.size > 0 || tilesToAddInOrder.size > 0){
			if(galacticFrame){
				this.order3TilesCacheGalactic = null;
			} else {
				this.order3TilesCache = null;
			}
			if(galacticFrame){
				this.galacticModels.forEach(model => {
					model.visibleTilesChanged(tilesRemoved, tilesToAddInOrder);
				});
			} else {
				this.j2000Models.forEach(model => {
					model.visibleTilesChanged(tilesRemoved, tilesToAddInOrder);
				});
			}
			eventBus.fireEvent(new VisibleTilesChangedEvent(tilesRemoved, tilesToAddInOrder, galacticFrame));
		}
	}

	pollViewAndAddTiles(xyPollingPoints, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, galactic) {
		let maxX = global.gl.canvas.width;
		let maxY = global.gl.canvas.height;

		for (let i = 0; i <= maxX; i += maxX / xyPollingPoints) {
			for (let j = 0; j <= maxY; j += maxY / xyPollingPoints) {
				this.pollPoint(i, j, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, galactic);
			}
		}
	}

	pollCenter(previouslyVisibleKeys, tilesRemoved, tilesAdded, galactic) {
		let tilesToAddInOrder = new Map();
		let maxX = global.gl.canvas.width;
		let maxY = global.gl.canvas.height;
		let xyPollingPoints = 3;
		this.pollPoint(maxX / 2, maxY / 2, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, galactic);
		for (let i = maxX / xyPollingPoints; i <= maxX * 2 / xyPollingPoints; i += maxX / xyPollingPoints) {
			for (let j = maxY / xyPollingPoints; j <= maxY * 2 / xyPollingPoints; j += maxY / xyPollingPoints) {
				this.pollPoint(i, j, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, galactic);
			}
		}
		return tilesToAddInOrder;
	}

	pollPoint(x, y, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, galactic) {
		let model = undefined;
		if(galactic && this.galacticModels.length > 0){
			model = this.galacticModels[0];
		} else  if (!galactic && this.j2000Models.length > 0){
			model = this.j2000Models[0];
		} else {
			return;
		}
		let intersectionWithModel = RayPickingUtils.getIntersectionPointWithSingleModel(x, y, model);
		let intersectionPoint = intersectionWithModel.intersectionPoint;
		// TODO probably it would be better to use query_disc_inclusive from HEALPix
		// against a polygon. Check my FHIPSWebGL2 project (BufferManager.js -> updateVisiblePixels)
		if (intersectionPoint.length > 0) { 
			let currP = new Pointing(new Vec3(intersectionPoint[0], intersectionPoint[1], intersectionPoint[2]));
			let currPixNo = global.getHealpix(this.order).ang2pix(currP);
			if (currPixNo >= 0) {
				let tile = {order: this.order, ipix: currPixNo, key: this.order + "/" + currPixNo};
				if(galactic){
					this.visibleTilesGalactic.set(tile.key, tile);
				} else {
					this.visibleTiles.set(tile.key, tile);
				}
				if (previouslyVisibleKeys.has(tile.key)) {
					tilesRemoved.delete(tile.key);
				} else {
					if (tilesAdded.get(tile.key) !== tile) {
						tilesToAddInOrder.set(tile.key, tile);
					}
					tilesAdded.set(tile.key, tile);
				}
			}
		}
	}

	addNeighbours(currPixNo, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder, visibleTiles) {
		let neighbours = global.getHealpix(this.order).neighbours(currPixNo);
		for (let k = 0; k < neighbours.length; k++) {
			let tile = {order: this.order, ipix: neighbours[k], key: this.order + "/" + neighbours[k]};
			if (neighbours[k] >= 0 && !visibleTiles.has(tile.key)) {
				visibleTiles.set(tile.key, tile);

				if (previouslyVisibleKeys.has(tile.key)) {
					tilesRemoved.delete(tile.key);
				} else {
					if(tilesAdded.get(tile.key) !== tile){
						tilesToAddInOrder.set(tile.key, tile);
					}
					tilesAdded.set(tile.key, tile);
				}
			}
		}
	}

}

export const visibleTilesManager = new VisibleTilesManager();

