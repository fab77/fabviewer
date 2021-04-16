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
                this.html.on("click", (e)=>{
                    let checkbox = this.html.find("input");
                    let newValue = !checkbox.prop('checked'); 
                    checkbox.prop('checked', newValue);
                    checkbox.attr('checked', newValue);
                    handler(newValue);
                });
                this.html.find("input").on("click", function(e){
                    e.stopPropagation();
                    handler(this.checked);
                });

                this.html.find("label").on("click", (e)=>{
                    e.stopPropagation();
                });
            }
        }
        return _public;
    }
 
    init(){
    	this.html = $("<div class='dataRow'><input type='checkbox'/><label></label></div>");
    }
}

export default FootprintView;