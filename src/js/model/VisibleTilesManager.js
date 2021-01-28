"use strict";
/**
 * @author Henrik Norman
 */

import global from '../Global';
import RayPickingUtils from '../utils/RayPickingUtils';
import {Vec3, Pointing} from 'healpixjs';
import {vec3, mat4} from 'gl-matrix';
import eventBus from '../events/EventBus';
import VisibleTilesChangedEvent from '../events/VisibleTilesChangedEvent';



class VisibleTilesManager {

	constructor(){
		this.radius = 1;
		this.order = 0;
		this.visibleTiles = {};
		setInterval(()=> {this.updateVisibleTiles();}, 100);
	}

	get visibleTilesOfHighestOrder(){
		return this.visibleTiles;
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
		}else if (in_fov >= 0.08){
			this.order = 11;
		}else{
			this.order = 12;
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
		let previouslyVisibleKeys = Object.keys(this.visibleTiles);
		let tilesRemoved = this.visibleTiles;
		let tilesAdded = {};
		this.visibleTiles = {};
		let tilesToAddInOrder = this.pollCenter(previouslyVisibleKeys, tilesRemoved, tilesAdded);

		this.pollViewAndAddTiles(7, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
		
		Object.keys(this.visibleTiles).forEach(key =>{
			this.addNeighbours(this.visibleTiles[key].ipix, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
		});

		eventBus.fireEvent(new VisibleTilesChangedEvent(tilesRemoved, tilesToAddInOrder));
		global.visibleTiles = this.visibleTiles;
	}

	pollViewAndAddTiles(xyPollingPoints, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder) {
		let maxX = global.gl.canvas.width;
		let maxY = global.gl.canvas.height;

		for (let i = 0; i <= maxX; i += maxX / xyPollingPoints) {
			for (let j = 0; j <= maxY; j += maxY / xyPollingPoints) {
				this.pollPoint(i, j, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
			}
		}
	}

	pollCenter(previouslyVisibleKeys, tilesRemoved, tilesAdded) {
		let tilesToAddInOrder = [];
		let maxX = global.gl.canvas.width;
		let maxY = global.gl.canvas.height;
		let xyPollingPoints = 3;
		this.pollPoint(maxX / 2, maxY / 2, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
		for (let i = maxX / xyPollingPoints; i <= maxX * 2 / xyPollingPoints; i += maxX / xyPollingPoints) {
			for (let j = maxY / xyPollingPoints; j <= maxY * 2 / xyPollingPoints; j += maxY / xyPollingPoints) {
				this.pollPoint(i, j, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder);
			}
		}
		return tilesToAddInOrder;
	}

	pollPoint(x, y, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder) {
		let model = {center: vec3.clone([0.0, 0.0, 0.0]), radius: this.radius, getModelMatrixInverse: ()=>{return mat4.create()}};

		let intersectionWithModel = RayPickingUtils.getIntersectionPointWithSingleModel(x, y, model);
		let intersectionPoint = intersectionWithModel.intersectionPoint;
		// TODO probably it would be better to use query_disc_inclusive from HEALPix
		// against a polygon. Check my FHIPSWebGL2 project (BufferManager.js -> updateVisiblePixels)
		if (intersectionPoint.length > 0) {
			let currP = new Pointing(new Vec3(intersectionPoint[0], intersectionPoint[1], intersectionPoint[2]));
			let currPixNo = global.getHealpix(this.order).ang2pix(currP);
			if (currPixNo >= 0) {
				let tile = {order: this.order, ipix: currPixNo, key: this.order + "/" + currPixNo};
				this.visibleTiles[tile.key] = tile;
				if (previouslyVisibleKeys.includes(tile.key)) {
					delete tilesRemoved[tile.key];
				} else {
					if (tilesAdded[tile.key] !== tile) {
						tilesToAddInOrder.push(tile);
					}
					tilesAdded[tile.key] = tile;
				}
			}
		}
	}

	addNeighbours(currPixNo, previouslyVisibleKeys, tilesRemoved, tilesAdded, tilesToAddInOrder) {
		let neighbours = global.getHealpix(this.order).neighbours(currPixNo);
		for (let k = 0; k < neighbours.length; k++) {
			if (neighbours[k] >= 0 && this.visibleTiles[neighbours[k]] == undefined) {
				let tile = {order: this.order, ipix: neighbours[k], key: this.order + "/" + neighbours[k]};
				this.visibleTiles[tile.key] = tile;

				if (previouslyVisibleKeys.includes(tile.key)) {
					delete tilesRemoved[tile.key];
				} else {
					if(tilesAdded[tile.key] !== tile){
						tilesToAddInOrder.push(tile);
					}
					tilesAdded[tile.key] = tile;
				}
			}
		}
		return neighbours;
	}

}

export const visibleTilesManager = new VisibleTilesManager();

