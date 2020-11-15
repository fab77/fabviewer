"use strict";
/**
 * @author Fabrizio Giordano (Fab77)
 */
import $ from 'jquery';

class HiPSSettingsView{
 
    constructor(in_model, in_formats){
        
    	console.log(in_model);
    	this._model = in_model;
    	this._formats = in_formats;
    	
    	this.init();
        
        
        
        var _public = {
    
            getHtml: ()=>{
                return this.html;
            }

        }
        return _public;
    }
 
    init(){

    	this.html = $("<div id='hipsSettings'>"+this._model.surveyName+"<br>" +
    			"<div id='hips-formats'></div><label for='hips-formats'>Formats:</label>" + this.initFormats() +
    			"<div id='hips-col-pal'></div><label for='hips-col-pal'>Color palette:</label>" +
    			"</div>");
    	this.html.css("position","absolute");
    	this.html.css("height","200px");
    	this.html.css("width","400px");
    	this.html.css("left","121%");
    	this.html.css("top","10%");
    	this.html.css("border","1px solid black");
    	this.html.css("background-color","rgba(255, 255, 255, .15)");
    	this.html.css("backdrop-filter","blur(5px)");
    	this.html.css("color","#85d6d1");
    	this.html.css("cursor","move");
    	
    	
    }
    
    initFormats(){
    	let html = "<select name='format' onmousedown='event.stopPropagation()'>";
    	for (var i = 0; i < this._formats.length; i++){
    		html += "<option value='"+this._formats[i]+"'>"+this._formats[i]+"</option>";
    	}
    	html += "</select>";
    	return html;
    }
    
    appendFITSSettings(){
    	// TODO here we should put the min and max value, scale function and all features exposed by FITSOnTheWeb
    	this.html.append("<div id='fitsontheweb'>// TODO FITSOnTheWeb features here.</div>");
    	
    }
}

export default HiPSSettingsView;