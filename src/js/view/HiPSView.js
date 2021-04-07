
import $ from 'jquery';

class HiPSView{
 
    constructor(){
    	
        this.init();
        
        var _public = {
    
            getHtml: ()=>{
                return this.html;
            },
            setModel: (model, formats)=>{
                this.html.find("input[type='checkbox']").attr('id', model.surveyName + "-hips-selection");
                this.html.find("label").attr('for', model.surveyName + "-hips-selection");
                this.html.find("label").html(model.surveyName);
                this.html.find("select").append(this.formatOptions(formats));
            },
            addCheckedHandler: (handler)=>{
                this.html.find("input[type='checkbox']").on('change', handler);
            },
            setChecked: (checked)=>{
                this.html.find("input[type='checkbox']").prop('checked', true);
            },
            addFormatChangedHandler: (handler)=>{
                this.html.find("select").on('change', handler);
            },
            addOpacityChangedHandler: (handler)=>{
                this.html.find("input[type='range']").on('input', handler);
            },
            getSelectedFormat: ()=>{
                return this.html.find("select").find(":selected").val();
            },
            getSelectedOpacity: ()=>{
                return this.html.find("input[type='range']").val();
            }

        }
        return _public;
    }
 
    init(){
        this.html = $("<li>"
        + "<input type='checkbox' name='hips'/><label style='white-space: nowrap; flex: auto'></label>"
        + "<select name='format' id='format' onmousedown='event.stopPropagation()'></select>"
//        + "<div onmousedown='event.stopPropagation()'>"
//        + "<div'>"
        + "<input type='range' min='0' max='100' value='100'>"
//        + "</div>"
        + "</li>");
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