"use strict";
import $ from 'jquery';

class FootprintView{
 
    constructor(){
        this.init();
        var _public = {
    
            getHtml: ()=>{
                return this.html;
            },
            setModel: (model)=>{
                this.html.find("input").attr('id', model.datasetName + "-footprint");
                this.html.find("label").attr('for', model.datasetName+ "-footprint");
                this.html.find("label").html(model.datasetName);
    
            },
            addCheckedHandler: (handler)=>{
                this.html.find("input").click(handler);
            }
        }
        return _public;
    }
 
    init(){
    	this.html = $("<li><label></label><input type='checkbox'/></li>");
    }
}

export default FootprintView;