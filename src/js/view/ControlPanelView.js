/**
 * @author Fabrizio Giordano (Fab)
 */
import $ from 'jquery';

class ControlPanelView {

	_html;

	constructor () {
		this._html = "<div id='minimaximise'>" +
		"	<img class='myButton' src='dest/ham-open.png' />" +
		"</div>" +
		"<div id='catalogues'>" +
		"	<img id='cataloguesButton' class='myButton' src='dest/catbutton2.png' />" +
		"</div>" +
		"<div id='imaging' class='myButton'>" +
		"	<img id='footprintsButton' class='myButton' src='dest/imgbutton2.png' />" +
		"</div>" +
		"<div id='spectra' class='myButton'>" +
		"	<img id='spectraButton' class='myButton' src='dest/spebutton2.png' />" +
		"</div>" +
		"<div id='astromaps' class='myButton'>" +
		"	<img id='mapsButton' class='myButton' src='dest/mapbutton2.png' />" +
		"</div>" +
		"<div id='settings' class='myButton'>" +
		"	<img class='myButton' src='dest/settings.png' />" +
		"</div>";
		
		
	}

	get html(){
		return this._html;
	}
	
	appendChild(html){
		$("#controlpanel2container").append(html);
	};

}
export default ControlPanelView;