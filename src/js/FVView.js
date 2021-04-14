/**
 * @author Fabrizio Giordano (Fab)
 */

import $ from "jquery";
class FVView{
	
	constructor(in_canvas){
		if (DEBUG){
			console.log("[FVView::FVView]");
		}
		this.webglFactor = 1;
		this.controlFactor = 0.30;
		this.init(in_canvas);
	}
	
	init(in_canvas){
		if (DEBUG){
			console.log("[FVView::init]");
		}
		this.canvas = in_canvas;
		this.container = document.getElementById('fabvcontainer');
		this.container.style.height = window.innerHeight + 'px';
		this.container.style.width = window.innerWidth + 'px';
		this.controlpanel = document.getElementById('controlpanel');
		this.datapanel = document.getElementById('datapanel');
		
		this.widthToHeight = 4 / 3;
	};
	
	addHipsButtonHandler(handler){
		$("#hips_button").on("click", handler);
	}
	
	appendChild(html){
		$("#controlpanel").append(html);
		
	};
	
	appendChild2(html){
		$("#controlpanel2container").append(html);
		
	};
	
	append2Body(html){
		$("body").append(html);
		
	};

	fillCataloguesDiv(cataloguesDescriptor){
		console.log("[FVView::fillCataloguesDiv ]");

		for (let [key, catalogue] of Object.entries(cataloguesDescriptor.descriptors) ) {

			this.cataloguesDiv.innerHTML += "<input type='checkbox' onclick='"+test+"' id='cat_"+catalogue.guiShortName+"' name='cat_"+catalogue.guiShortName+"' value='cat_"+catalogue.guiShortName+"'><label for='cat_"+catalogue.guiShortName+"'> "+catalogue.guiShortName+"</label><br>";
		}

	};
	
	dragControl(elmnt) {
		  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		  if (elmnt) {
		    // if present, the header is where you move the DIV from:
			  elmnt.onmousedown = dragMouseDown;
		  } else {
		    // otherwise, move the DIV from anywhere inside the DIV:
		    elmnt.onmousedown = dragMouseDown;
		  }

		  function dragMouseDown(e) {
		    e = e || window.event;
//		    e.preventDefault();
		    // get the mouse cursor position at startup:
		    pos3 = e.clientX;
		    pos4 = e.clientY;
		    document.onmouseup = closeDragElement;
		    // call a function whenever the cursor moves:
		    document.onmousemove = elementDrag;
		  }

		  function elementDrag(e) {
		    e = e || window.event;
		    e.preventDefault();
		    // calculate the new cursor position:
		    pos1 = pos3 - e.clientX;
		    pos2 = pos4 - e.clientY;
		    pos3 = e.clientX;
		    pos4 = e.clientY;
		    // set the element's new position:
		    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
		  }

		  function closeDragElement() {
		    // stop moving when mouse button is released:
		    document.onmouseup = null;
		    document.onmousemove = null;
		  }
		};
	
	
	
	resize(in_gl){
		if (DEBUG){
			console.log("[FVView::resize]");
		}
		var newWidth = window.innerWidth;
		var newHeight = window.innerHeight;
	    
	    var newWidthToHeight = newWidth / newHeight;

	    if (newWidthToHeight > this.widthToHeight) {
	        newWidth = newHeight * this.widthToHeight;
	        this.container.style.height = (newHeight * this.webglFactor) + 'px';
	        this.container.style.width = (newWidth  * this.webglFactor) + 'px';
	    } else {
	        newHeight = newWidth / this.widthToHeight;
	        this.container.style.width = (newWidth  * this.webglFactor) + 'px';
	        this.container.style.height = (newHeight * this.webglFactor) + 'px';
	    }

	    this.canvas.width = (newWidth  * this.webglFactor) - 10;
	    this.canvas.height = (newHeight * this.webglFactor) - 10;
	    in_gl.viewportWidth = this.canvas.width;
	    in_gl.viewportHeight = this.canvas.height; 

//	    this.controlpanel.style.top = '0px';
//	    this.controlpanel.style.height = this.canvas.height + 'px';
//	    this.controlpanel.style.width = (window.innerWidth  * this.controlFactor) + 'px';
		
	    if (DEBUG){
			console.log("[FVView::resize][canvas] " + this.canvas.width + " " + this.canvas.height);
		   	console.log("[FVView::resize][gl] " + in_gl.viewportWidth + " " + in_gl.viewportHeight);
		}
	   	
		
	};
}

export default FVView;