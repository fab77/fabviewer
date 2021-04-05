/**
 * @author Fabrizio Giordano (Fab)
 */
"use strict";

import $ from 'jquery';

class FITSView {

	_html;

	constructor () {
		this._html = "<label for='fitsEnabled'>FITS</label><input id='fitsEnabled' type='checkbox'/><label></label><br>";
		
		
	}

	get html(){
		return this._html;
	}
	
	addCheckedHandler(handler){
		var checkbox = document.getElementById("fitsEnabled");
		$('#fitsEnabled').click(handler);
    }

}
export default FITSView;