
import $ from 'jquery';

class CoordinatesPanelView{
 
	_html;
	_model;
	_showSphericalCoords;
	
    constructor(){
    	
        this.init();
        
        var _public = {
    
            getHtml: ()=>{
                return this._html;
            },
            setModel: (in_raDecDeg, in_raHMS, in_decDMS, phi, theta)=>{

            	$('#raDecDeg').html(in_raDecDeg.ra.toFixed(4)+' '+in_raDecDeg.dec.toFixed(4));
            	
            	let sign = '+';
        		if (in_decDMS.d < 0){
        			sign = '';
        		}
            	$('#raDecHms').html(in_raHMS.h +" "+in_raHMS.m +" "+in_raHMS.s.toFixed(2)+ " "+sign+in_decDMS.d+" "+in_decDMS.m+" "+in_decDMS.s.toFixed(2));
            	
            	if(this._showSphericalCoords){
            		$('#phiThetaDeg').html(phi.toFixed(4) +" "+theta.toFixed(4));
            	}
            },
            showSphericalCoords: (show) => {
            	this._showSphericalCoords = show;
            	if (!this._showSphericalCoords){
            		$('#phiTheta').css("display", "none");
            	}else{
            		$('#phiTheta').css("display", "block");
            	}
            } 
        }
        return _public;
    }
 
    
    
    init(){
    	this._html = $("<div id='coordsContainer'>" +
    			"<div>RA/Dec (degrees) <span id='raDecDeg'></span></div>" +
    			"<div>RA/Dec (hms/dms) <span id='raDecHms'></span></div>" +
    			"<div id='phiTheta'>Phi/Theta (degs) <span id='phiThetaDeg'></span></div>" +
    			"</div>");
    }
}

export default CoordinatesPanelView;