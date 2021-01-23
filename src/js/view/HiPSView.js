
import $ from 'jquery';

class HiPSView{
 
    constructor(){
    	
        this.init();
        
        var _public = {
    
            getHtml: ()=>{
                return this.html;
            },
            setModel: (model)=>{
            	
//            	console.log(model);
//            	console.log(formats);
                this.html.find("input").attr('id', model.surveyName);
                this.html.find("label").attr('for', model.surveyName);
                this.html.find("label").html(model.surveyName);
    
            },
            addCheckedHandler: (handler)=>{
                this.html.find("input").on('change', handler);
            },
            setChecked: (checked)=>{
                this.html.find("input").prop('checked', true);
            },
            addHiPSSettingsHandler: (handler)=>{
            	this.html.find("button").click(handler);
            },
            appendSettingsPopup: (hipsSettingsHTML)=>{
            	this.html.append(hipsSettingsHTML);
            }

        }
        return _public;
    }
 
    init(){
//    	this.html = $("<li><input type='checkbox'/><label></label><button>O</button><br></li>");
    	this.html = $("<tr><td><input type='checkbox' name='hips'/><label></label></td><td><button>O</button></td></tr>");
//    	this.html.css("height","150px");
    }
}

export default HiPSView;