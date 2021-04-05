/**
 * @author Fabrizio Giordano (Fab)
 */

import $ from "jquery";
class FVView{
	
	constructor(in_canvas, insideSphere){
		if (DEBUG){
			console.log("[FVView::FVView]");
		}
		this.webglFactor = 1;
		this.controlFactor = 0.30;
		this.init(in_canvas, insideSphere);
	}
	
	init(in_canvas, insideSphere){
		if (DEBUG){
			console.log("[FVView::init]");
		}
		this.canvas = in_canvas;
		this.container = document.getElementById('fabvcontainer');
		this.container.style.height = window.innerHeight + 'px';
		this.container.style.width = window.innerWidth + 'px';
		this.controlpanel = document.getElementById('controlpanel');
		this.datapanel = document.getElementById('datapanel');
		
		this.pickedobjvalue_dom = document.getElementById('pickedobjectvalue');
		
		this.fovvalue_dom = document.getElementById('fovvalue');
		this.coords_phi_dom = document.getElementById('phi');
		this.coords_theta_dom = document.getElementById('theta');
		
		this.coords_radeg_dom = document.getElementById('RA_deg');
		this.coords_decdeg_dom = document.getElementById('Dec_deg');
		
		this.coords_rahms_dom = document.getElementById('RA_hms');
		this.coords_decdms_dom = document.getElementById('Dec_dms');
		
		

		this.order0 = document.getElementById('order0');
		this.order1 = document.getElementById('order1');
		this.order2 = document.getElementById('order2');
		this.order3 = document.getElementById('order3');
		this.order4 = document.getElementById('order4');
		this.order5 = document.getElementById('order5');
		this.order6 = document.getElementById('order6');
		this.order7 = document.getElementById('order7');
		this.order8 = document.getElementById('order8');
		this.order9 = document.getElementById('order9');


		this.healpixGridCheckbox = document.getElementById('healpix-grid-checkbox');
		this.insideSphereCheckbox = document.getElementById('inside-sphere-checkbox');
		this.insideSphereCheckbox.checked = insideSphere;
//		this.fpsvalue_dom = document.getElementById('fpsvalue');
//		this.avgfpsvalue_dom = document.getElementById('avgfpsvalue');
		
		this.fovX_deg = 180.0;
		this.fovY_deg = 180.0;
//		this.previousFoV = 180;
//		this.updateFoV([this.fovX_deg, this.fovY_deg]);
				
		this.widthToHeight = 4 / 3;
		
		// Make the DIV element draggable:
		this.dragControl(document.getElementById("controlpanel"));

//		this.cataloguesDiv = document.getElementById('catalogues');
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

	addHealpixGridCheckboxHandler(handler){
		this.healpixGridCheckbox.onclick = handler;
	}

	addInsideSphereCheckboxHandler(handler){
		this.insideSphereCheckbox.onclick = handler;
	}
	
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
	
//	this.updateFps = function(in_fps, in_avg){
//		
//		this.fpsvalue_dom.innerHTML = in_fps.toFixed(1);
//		this.avgfpsvalue_dom.innerHTML = in_avg.toFixed(1);
//		
//	};
	
	updateFoV(in_fovObj){
		if (DEBUG){
			console.log("[FVView::updateFoV]");
		}
		this.fovvalue_dom.innerHTML = in_fovObj.fovXDeg.toFixed(4) + '&deg;x'+ in_fovObj.fovYDeg.toFixed(4) + '&deg;';
//		this.previousFoV = (in_fovXY[0] <= in_fovXY[1]) ? in_fovXY[0] : in_fovXY[1];
		
	};
	
	setPickedSphericalCoordinates(phiThetaDeg){
		this.coords_phi_dom.innerHTML = phiThetaDeg.phi.toFixed(4);
		this.coords_theta_dom.innerHTML = phiThetaDeg.theta.toFixed(4);
	};
	
	setPickedAstroCoordinates(raDecDeg, raHMS, decDMS){
		this.coords_radeg_dom.innerHTML = raDecDeg.ra.toFixed(4);
		this.coords_decdeg_dom.innerHTML = raDecDeg.dec.toFixed(4);
		this.coords_rahms_dom.innerHTML = raHMS.h +" "+raHMS.m +" "+raHMS.s.toFixed(2);
		var sign = '+';
		if (decDMS.d < 0){
			sign = '';
		}
		this.coords_decdms_dom.innerHTML = sign+decDMS.d+" "+decDMS.m+" "+decDMS.s.toFixed(2);
	};
	
	setPickedObjectName(name){
		this.pickedobjvalue_dom.innerHTML = name;
	};

	setHoverIpix(order, ipix){
		if(order == 0){
			this.order0.innerHTML = "0/" + ipix; 
		} else if (order == 1){
			this.order1.innerHTML = "1/" + ipix;
		} else if (order == 2){
			this.order2.innerHTML = "2/" + ipix;
		} else if (order == 3){
			this.order3.innerHTML = "3/" + ipix;
		} else if (order == 4){
			this.order4.innerHTML = "4/" + ipix;
		} else if (order == 5){
			this.order5.innerHTML = "5/" + ipix;
		} else if (order == 6){
			this.order6.innerHTML = "6/" + ipix;
		} else if (order == 7){
			this.order7.innerHTML = "7/" + ipix;
		} else if (order == 8){
			this.order8.innerHTML = "8/" + ipix;
		} else if (order == 9){
			this.order9.innerHTML = "9/" + ipix;
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