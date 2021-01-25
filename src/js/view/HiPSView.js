
import $ from 'jquery';

class HiPSView{
 
    constructor(){
    	
        this.init();
        
        var _public = {
    
            getHtml: ()=>{
                return this.html;
            },
            setModel: (model, formats)=>{
            	
//            	console.log(model);
//            	console.log(formats);
                this.html.find("input").attr('id', model.surveyName);
                this.html.find("label").attr('for', model.surveyName);
                this.html.find("label").html(model.surveyName);
                this.html.find("select").append(this.formatOptions(formats));
                //TODO select format...
    
            },
            addCheckedHandler: (handler)=>{
                this.html.find("input").on('change', handler);
            },
            setChecked: (checked)=>{
                this.html.find("input").prop('checked', true);
            },
            addFormatChangedHandler: (handler)=>{
                this.html.find("select").on('change', handler);
            },

        }
        return _public;
    }
 
    init(){
        this.html = $("<div style='display: flex;align-items: center; justify-content: space-between;'><input type='checkbox' name='hips'/><label style='white-space: nowrap'></label>"
        + "<select name='format' id='format' onmousedown='event.stopPropagation()'></select></div>");
    }

    formatOptions(formats){
        let html = "";
    	for (var i = 0; i < formats.length; i++){
    		html += "<option value='" + formats[i]+"'>" + formats[i] + "</option>";
        }
        return html;
    }
}

export default HiPSView;