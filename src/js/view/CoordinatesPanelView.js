
import $ from 'jquery';

class CoordinatesPanelView{
 
	_html;
	_model;
	
    constructor(){
    	
        this.init();
        
        var _public = {
    
            getHtml: ()=>{
                return this._html;
            },
            setModel: (in_raDecDeg, in_raHMS, in_decDMS)=>{
            	
            	$('#raDecDeg').html(in_raDecDeg.ra.toFixed(4)+' '+in_raDecDeg.dec.toFixed(4));
            	
            	let sign = '+';
        		if (in_decDMS.d < 0){
        			sign = '';
        		}
            	$('#raDecHms').html(in_raHMS.h +" "+in_raHMS.m +" "+in_raHMS.s.toFixed(2)+ " "+sign+in_decDMS.d+" "+in_decDMS.m+" "+in_decDMS.s.toFixed(2));
            }
        }
        return _public;
    }
 
    init(){
    	this._html = $("<div id='coordsContainer'>" +
    			"<div>RA/Dec (degrees) <span id='raDecDeg'></span></div>" +
    			"<div>RA/Dec (hms/dms) <span id='raDecHms'></span></div>" +
    			"</div>");
    }
}

export default CoordinatesPanelView;