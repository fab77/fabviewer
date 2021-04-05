
import $ from "jquery";
class CataloguePanelView{
 
	_html;
	_visible;
	
    constructor(){
    	
    
        this.init();
    
        var _public = {
            getHtml: ()=>{
                return this._html;
            },
            addCatalogue: (catalogueView)=>{
                this._html.find("#catalogueList").append(catalogueView.getHtml());
            },
            toggle: ()=>{
            	if (this._visible){
            		this._html.css("display","none");
            		this._visible = false;
            	}else{
            		this._html.css("display","block");
            		this._visible = true;
            	}
            	
            }
            
        }
     
        return _public;
    }
 
    init(){
    	this._visible = false;
        this._html = $("<div id='cataloguePanel'><ul id='catalogueList'></ul></div>");
        this._html.css("display","none");
    }
    
    
 
}

export default CataloguePanelView;