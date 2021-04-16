
import $ from "jquery";
class SpectraPanelView{
 
	_html;
	_visible;
	
    constructor(){
    	
    
        this.init();
    
        var _public = {
            getHtml: ()=>{
                return this._html;
            },
            addDataset: (footprintView)=>{
                this._html.find("#spectraList").append(footprintView.getHtml());
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
        this._html = $("<div id='spectraPanel' class='controlPanel'><div id='spectraList'></div></div>");
        this._html.css("display","none");
    }
    
    
 
}

export default SpectraPanelView;