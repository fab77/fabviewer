"use strict";

class VisibleTilesChangedEvent{
	
	_tilesRemoved;
	_tilesToAddInOrder;
	_isGalactic;
	static name = "VisibleTilesChangedEvent";
	
	constructor(tilesRemoved, tilesToAddInOrder, isGalactic){
		this._tilesRemoved = tilesRemoved;
		this._tilesToAddInOrder = tilesToAddInOrder;
		this._isGalactic = isGalactic;
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

	get isGalactic(){
		return this._isGalactic;
	}
}

export default VisibleTilesChangedEvent;