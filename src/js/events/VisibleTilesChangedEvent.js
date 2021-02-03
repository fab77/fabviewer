"use strict";

class VisibleTilesChangedEvent{
	
	_tilesRemoved;
	_tilesToAddInOrder;
	static name = "VisibleTilesChangedEvent";
	
	constructor(tilesRemoved, tilesToAddInOrder){
		this._tilesRemoved = tilesRemoved;
		this._tilesToAddInOrder = tilesToAddInOrder;
	}
	
	get name(){
		return VisibleTilesChangedEvent.name;
	}
	
	get tilesRemoved(){
		return this._tilesRemoved;
	}

	get tilesToAddInOrder(){
		return this._tilesToAddInOrder;
	}
}

export default VisibleTilesChangedEvent;