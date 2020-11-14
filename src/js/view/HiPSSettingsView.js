
import $ from 'jquery';

class HiPSSettingsView{
 
    constructor(in_model){
        
    	console.log(in_model);
    	this._model = in_model;
    	this.init();
        
        
        
        var _public = {
    
            getHtml: ()=>{
                return this.html;
            }

        }
        return _public;
    }
 
    init(){

    	this.html = $("<div id='hipsSettings'>"+this._model.surveyName+"</div>");
    	this.html.css("position","absolute");
    	this.html.css("height","200px");
    	this.html.css("width","400px");
    	this.html.css("left","100%");
    	this.html.css("top","20%");
    	this.html.css("border","1px solid aliceblue");
    	
    }
}

export default HiPSSettingsView;