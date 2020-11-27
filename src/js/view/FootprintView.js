
import $ from 'jquery';

class FootprintView{
 
    constructor(){
        this.init();
        var _public = {
    
            getHtml: ()=>{
                return this.html;
            },
            setModel: (model)=>{
                this.html.find("input").attr('id', model.name);
                this.html.find("label").attr('for', model.name);
                this.html.find("label").html(model.name);
    
            },
            addCheckedHandler: (handler)=>{
                this.html.find("input").click(handler);
            }
        }
        return _public;
    }
 
    init(){
    	this.html = $("<li><input type='checkbox'/><label></label><br></li>");
    }
}

export default FootprintView;