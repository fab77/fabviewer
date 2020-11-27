"use strict";

class FPCatalogueDescriptor{
	
	#datasetName;
	#tapTable;
	#raTapColumn;
	#decTapColumn;
	#uidTapColumn;
	#shapeColor;
	#stcs;
	
	
	constructor(in_fpCatalogueDescriptorJSON){
		
		this.#datasetName = in_fpCatalogueDescriptorJSON.guiShortName;
		this.#tapTable = in_fpCatalogueDescriptorJSON.tapTable;
		this.#raTapColumn = in_fpCatalogueDescriptorJSON.tapRaColumn;
		this.#decTapColumn = in_fpCatalogueDescriptorJSON.tapDecColumn;
		this.#uidTapColumn = in_fpCatalogueDescriptorJSON.uniqueIdentifierField;
		this.#shapeColor = in_fpCatalogueDescriptorJSON.primaryColor;
		this.#stcs = in_fpCatalogueDescriptorJSON.tapSTCSColumn;
        
	}
	
	get datasetName(){
		return this.#datasetName;
	}
	
	get tapTable(){
		return this.#tapTable;
	}
	
	get raTapColumn(){
    	return this.#raTapColumn;
    }
	
    get decTapColumn(){
    	return this.#decTapColumn;
    }
    
    get uidTapColumn(){
    	return this.#uidTapColumn;
    }
    
    get shapeColor(){
    	return this.#shapeColor;
    }
    
    get shapeColorHex(){
    	return this.#shapeColor;
    }
    
    get shapeColorRgb(){
//    	Utils.
    	
    	return this.#shapeColor;
    }
    
    get stcs() {
    	return this.#stcs;
    }
	
}

export default FPCatalogueDescriptor;
