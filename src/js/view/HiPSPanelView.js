
import $ from "jquery";
class HiPSPanelView{
 
	_html;
	_visible;
	
    constructor(){
    	
    
        this.init();
    
        var _public = {
            getHtml: ()=>{
                return this._html;
            },
            addHiPS: (hipsView)=>{
                this._html.append(hipsView.getHtml());
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
        this._html = $("<div id='hipsPanel' class='controlPanel'></div>");
        this._html.css("display","none");
    }
    
    
 
}

export default HiPSPanelView;