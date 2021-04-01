"use strict";

class FPCatalogueDescriptor{
	
	_datasetName;
	_tapTable;
	_raTapColumn;
	_decTapColumn;
	_uidTapColumn;
	_shapeColor;
	_stcs;
	
	
	constructor(in_fpCatalogueDescriptorJSON){
		
		this._datasetName = in_fpCatalogueDescriptorJSON.mission;
		this._tapTable = in_fpCatalogueDescriptorJSON.tapTable;
		this._raTapColumn = in_fpCatalogueDescriptorJSON.tapRaColumn;
		this._decTapColumn = in_fpCatalogueDescriptorJSON.tapDecColumn;
		this._uidTapColumn = in_fpCatalogueDescriptorJSON.uniqueIdentifierField;
		this._shapeColor = in_fpCatalogueDescriptorJSON.primaryColor;
		this._stcs = in_fpCatalogueDescriptorJSON.tapSTCSColumn;
        
	}
	
	get datasetName(){
		return this._datasetName;
	}
	
	get tapTable(){
		return this._tapTable;
	}
	
	get raTapColumn(){
    	return this._raTapColumn;
    }
	
    get decTapColumn(){
    	return this._decTapColumn;
    }
    
    get uidTapColumn(){
    	return this._uidTapColumn;
    }
    
    get shapeColor(){
    	return this._shapeColor;
    }
    
    get shapeColorHex(){
    	return this._shapeColor;
    }
    
    get shapeColorRgb(){
    	
    	return this._shapeColor;
    }
    
    get stcs() {
    	return this._stcs;
    }
	
}

export default FPCatalogueDescriptor;
