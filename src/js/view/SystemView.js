/**
 * @author Fabrizio Giordano (Fab)
 */
"use strict";

import $ from "jquery";

class SystemView {

	constructor(){
		this.init();

		var _public = {

			getHtml : () => {
				return this.html;
			},
			setModel : function(model) {
				$("#fpsvalue").html(model.getFps());
				$("#avgfpsvalue").html(model.getAvgFps());
			},
			addFovPolyHandler : function(handler) {
				console.log("addFovPolyHandler ");
				$("#getFovPoly").on("click", handler);
			}
		}
	
		return _public;
	}

	init() {
//		console.log("SystemView.init()");
		this.html = $("<div id='fps'>"
				+ "<table style='width: 100%; text-align: center;'>" 
				+ "	<tr>"
				+ "	<th>FPS</th>"
				+ "	<th>Avg FPS</th>" 
				+ "</tr><tr>"
				+ "	<td><div id='fpsvalue'></div></td>"
				+ "	<td><div id='avgfpsvalue'></div></td>" 
				+ "</tr>"
				+ "</table></div>" 
				+ "<div id='getFovPoly' class='button' >getFovPoly</div>");
	}


}

export default SystemView;