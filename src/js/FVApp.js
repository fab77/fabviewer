/**
 * @author Fabrizio Giordano (Fab77)
 */
import FVView from './FVView';
import FVPresenter from './FVPresenter';
import global from './Global';


class FVApp{
	constructor(){
		if (DEBUG){
			console.log("[FVApp::FVApp]");
		}
		this.init();
		this.initListeners();
	}

	
	init(){
		if (DEBUG){
			console.log("[FVApp::init]");
		}
		var canvas = document.getElementById("fabviewer");
		
		try {
			if (DEBUG){
				console.log("[FVApp::init]canvas");
				console.log(canvas);
			}
			
			this.gl = canvas.getContext("webgl");
			
			let params = new URLSearchParams(location.search);
			if (params.get('debug') != null){
				console.warn("WebGL DEBUG MODE ON");
				this.gl = WebGLDebugUtils.makeDebugContext(this.gl);	
			}
			
			this.gl.viewportWidth = canvas.width;
			this.gl.viewportHeight = canvas.height;
			this.gl.clearColor(0.412, 0.412, 0.412, 1.0);
			
			this.gl.enable(this.gl.DEPTH_TEST);
			
		} catch (e) {
			console.log("Error instansiating WebGL context");
		}
		if (!this.gl) {
			alert("Could not initialise WebGL, sorry :-(");
		}
		
		this.view = new FVView(canvas);
		
		global.gl = this.gl;
		this.presenter = new FVPresenter(this.view, this.gl);
		
		this.fabVReqID = '';
		
		
	};
	
	initListeners(){
		
		var resizeCanvas = () => {
			if (DEBUG){
				console.log("[FVPresenter::addEventListeners->resizeCanvas]");
			}
		   	this.view.resize(this.gl);
		   	this.presenter.draw();
		}
		
		function handleContextLost(event){
			console.log("[handleContextLost]");
			event.preventDefault();
			cancelRequestAnimFrame(this.fabVReqID);
		}

		var handleContextRestored = (event) => {
			console.log("[handleContextRestored]");
			var canvas = document.getElementById("fabviewer");
			this.gl.viewportWidth = canvas.width;
			this.gl.viewportHeight = canvas.height;
			this.gl.clearColorrgbrgb(0.86, 0.86, 0.86, 1.0);
			
			this.gl.enable(this.gl.DEPTH_TEST);
			
			this.fabVReqID = requestAnimFrame(this.tick, canvas);
		}
		
		
		window.addEventListener('resize', resizeCanvas);
		this.view.canvas.addEventListener('webglcontextlost', handleContextLost, false);
		this.view.canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
		resizeCanvas();
	};
	
	run(){
		if (DEBUG){
			console.log("[FVApp::run]");
		}
		this.tick();
	};
	
	tick() {
		
		this.drawScene();
		if(DEBUG){
			// Only do this at DEBUG since every getError call takes 5-10ms
			var error = this.gl.getError();
			if (error != this.gl.NO_ERROR && error != this.gl.CONTEXT_LOST_WEBGL) {
				console.log("GL error: "+error);
			}
		}

		this.fabVReqID = requestAnimationFrame(()=>this.tick());
		
	}

	
	drawScene(){
		this.presenter.draw();
	};
	
	
}

export default FVApp;