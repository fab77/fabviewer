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
			setModel : (model)=> {
				this.html.find("#fpsvalue").html(model.getFps());
				this.html.find("#avgfpsvalue").html(model.getAvgFps());
			},
			addFovPolyHandler : (handler) => {
				console.log("addFovPolyHandler ");
				this.html.find("#getFovPoly").on("click", handler);
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