/**
 * @author Fabrizio Giordano (Fab)
 */
import $ from 'jquery';

class ControlPanelView {

	_html;

	constructor () {
		this._html = "<div id='controlButtonContainer'>" +
		"	<div id='hamburgerButton'>" + 
		"		<span></span><span></span><span></span><span></span>" +
		"	</div>" + 
		"	<img id='cataloguesButton' class='controlButton' src='dest/catbutton2.png' />" +
		"	<img id='footprintsButton' class='controlButton' src='dest/imgbutton2.png' />" +
		"	<img id='spectraButton' class='controlButton' src='dest/spebutton2.png' />" +
		"	<img id='mapsButton' class='controlButton' src='dest/mapbutton2.png' />" +
		"	<img id='settingsButton' class='controlButton' src='dest/settings.png' />"+
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