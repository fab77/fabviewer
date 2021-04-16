
import $ from "jquery";
class FootprintPanelView{
 
	_html;
	_visible;
	
    constructor(){
    	
    
        this.init();
    
        var _public = {
            getHtml: ()=>{
                return this._html;
            },
            addDataset: (footprintView)=>{
                this._html.find("#footprintList").append(footprintView.getHtml());
            },
            toggle: ()=>{
            	if (this._visible){
            		this._html.css("display","none");
            		this._visible = false;
            	}else{
            		this._html.css("display","block");
            		this._visible = true;
            	}
            	
            },
            close: ()=>{
            	if (this._visible){
            		this._html.css("display","none");
            		this._visible = false;
            	}
            }
            
        }
     
        return _public;
    }
 
    init(){
    	this._visible = false;
        this._html = $("<div id='footprintPanel', class='controlPanel'><div id='footprintList'></div></div>");
        this._html.css("display","none");
    }
    
    
 
}

export default FootprintPanelView;