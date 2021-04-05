
import $ from 'jquery';

class FoVView{
 
	_html;
	_model;
	
    constructor(){
    	
        this.init();
        
        var _public = {
    
            getHtml: ()=>{
                return this._html;
            },
            setModel: (in_fovObj)=>{
            	
//            	this.fovvalue_dom.innerHTML = in_fovObj.fovXDeg.toFixed(4) + '&deg;x'+ in_fovObj.fovYDeg.toFixed(4) + '&deg;';
                $('#fovValue').html(in_fovObj.fovXDeg.toFixed(4) + '&deg;x'+ in_fovObj.fovYDeg.toFixed(4) + '&deg;');
            }
        }
        return _public;
    }
 
    init(){
    	this._html = $("<div id='fovContainer'><label>FoV</label><span id='fovValue'></span></div>");
    }
}

export default FoVView;