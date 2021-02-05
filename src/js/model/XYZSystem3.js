function XYZSystem3(in_gl, in_cameraPosition){
	
	
	var currentObj = this;
//	console.log(currentObj);

	this.localInit = function(){
		
		currentObj.refSysPositionX = new Float32Array(3 * 2);
		currentObj.refSysPositionY = new Float32Array(3 * 2);
		currentObj.refSysPositionZ = new Float32Array(3 * 2);
		
		currentObj.shaderProgram = in_gl.createProgram();
		
		currentObj.modelMatrix = mat4.create();
		
	};
	
	this.initBuffer = function(){
		
	
//		var versors = [
//			[1.5, 0.0, 0.0],
//			[0.0, 1.5, 0.0],
//			[0.0, 0.0, 1.5]
//			];
		
		
		currentObj.refSysPositionX[0] = in_cameraPosition[0];
		currentObj.refSysPositionX[1] = in_cameraPosition[0];
		currentObj.refSysPositionX[2] = in_cameraPosition[0];
		currentObj.refSysPositionX[3] = in_cameraPosition[0] + 1.5;
		currentObj.refSysPositionX[4] = in_cameraPosition[0];
		currentObj.refSysPositionX[5] = in_cameraPosition[0];
		
		currentObj.refSysPositionY[0] = in_cameraPosition[1];
		currentObj.refSysPositionY[1] = in_cameraPosition[1];
		currentObj.refSysPositionY[2] = in_cameraPosition[1];
		currentObj.refSysPositionY[3] = in_cameraPosition[1];
		currentObj.refSysPositionY[4] = in_cameraPosition[1] + 1.5;
		currentObj.refSysPositionY[5] = in_cameraPosition[1];
		
		currentObj.refSysPositionZ[0] = in_cameraPosition[2];
		currentObj.refSysPositionZ[1] = in_cameraPosition[2];
		currentObj.refSysPositionZ[2] = in_cameraPosition[2];
		currentObj.refSysPositionZ[3] = in_cameraPosition[2];
		currentObj.refSysPositionZ[4] = in_cameraPosition[2];
		currentObj.refSysPositionZ[5] = in_cameraPosition[2] + 1.5;
				
		
		currentObj.refSysPositionXBuffer = in_gl.createBuffer();
		currentObj.refSysPositionYBuffer = in_gl.createBuffer();
		currentObj.refSysPositionZBuffer = in_gl.createBuffer();
	};
	
	this.initShaders = function () {
		var fragmentShader = getShader("xyz-shader-fs");
		var vertexShader = getShader("xyz-shader-vs");

		in_gl.attachShader(currentObj.shaderProgram, vertexShader);
		in_gl.attachShader(currentObj.shaderProgram, fragmentShader);
		in_gl.linkProgram(currentObj.shaderProgram);

		if (!in_gl.getProgramParameter(currentObj.shaderProgram, in_gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		shaderUtility.useProgram(currentObj.shaderProgram);

		currentObj.shaderProgram.vertexPositionAttribute = in_gl.getAttribLocation(currentObj.shaderProgram, "aVertexPosition");
		in_gl.enableVertexAttribArray(currentObj.shaderProgram.vertexPositionAttribute);

		currentObj.setUniformLocation(); 
		
	    function getShader(id){
	    	var shaderScript = document.getElementById(id);
			if (!shaderScript) {
				return null;
			}

			var str = "";
			var k = shaderScript.firstChild;
			while (k) {
				if (k.nodeType == 3) {
					str += k.textContent;
				}
				k = k.nextSibling;
			}

			var shader;
			if (shaderScript.type == "x-shader/x-fragment") {
				shader = in_gl.createShader(in_gl.FRAGMENT_SHADER);
			} else if (shaderScript.type == "x-shader/x-vertex") {
				shader = in_gl.createShader(in_gl.VERTEX_SHADER);
			} else {
				return null;
			}

			in_gl.shaderSource(shader, str);
			in_gl.compileShader(shader);

			if (!in_gl.getShaderParameter(shader, in_gl.COMPILE_STATUS)) {
				alert(in_gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
	    }
	    
	};
	
	this.setUniformLocation = function(){

		currentObj.shaderProgram.pMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uPMatrix");
		currentObj.shaderProgram.mMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uMMatrix");
		currentObj.shaderProgram.vMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uVMatrix");
		

	};
	
	this.enableBuffer = function(pMatrix, vMatrix){
		
		
		
		
		// -----------------
		shaderUtility.useProgram(currentObj.shaderProgram);
		currentObj.shaderProgram.pMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uPMatrix");
		currentObj.shaderProgram.mMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uMMatrix");
		currentObj.shaderProgram.vMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uVMatrix");
		
		currentObj.shaderProgram.vertexPositionAttribute = in_gl.getAttribLocation(currentObj.shaderProgram, "aVertexPosition");

		
		in_gl.uniformMatrix4fv(currentObj.shaderProgram.mMatrixUniform, false, currentObj.modelMatrix);
		in_gl.uniformMatrix4fv(currentObj.shaderProgram.pMatrixUniform, false, pMatrix);
		in_gl.uniformMatrix4fv(currentObj.shaderProgram.vMatrixUniform, false, vMatrix);

		
		// -----------------
		
		currentObj.shaderProgram.uAxisIndex = in_gl.getUniformLocation(currentObj.shaderProgram, "uAxisIndex");
		
		
		
		/*
		 * x: red
		 * y: green
		 * z: blue
		 */
		// rendering X axes
		in_gl.uniform1f(currentObj.shaderProgram.uAxisIndex, 1.0);
		in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.refSysPositionXBuffer);
		in_gl.bufferData(in_gl.ARRAY_BUFFER, currentObj.refSysPositionX, in_gl.STATIC_DRAW);
		in_gl.vertexAttribPointer(currentObj.shaderProgram.vertexPositionAttribute, 3, in_gl.FLOAT, false, 0, 0);
		in_gl.enableVertexAttribArray(currentObj.shaderProgram.vertexPositionAttribute);
		in_gl.drawArrays(in_gl.LINE_STRIP, 0, 2);

		// rendering Y axes
		in_gl.uniform1f(currentObj.shaderProgram.uAxisIndex, 2.0);
		in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.refSysPositionYBuffer);
		in_gl.bufferData(in_gl.ARRAY_BUFFER, currentObj.refSysPositionY, in_gl.STATIC_DRAW);
		in_gl.vertexAttribPointer(currentObj.shaderProgram.vertexPositionAttribute, 3, in_gl.FLOAT, false, 0, 0);
		in_gl.enableVertexAttribArray(currentObj.shaderProgram.vertexPositionAttribute);
		in_gl.drawArrays(in_gl.LINE_STRIP, 0, 2);

		// rendering Z axes
		in_gl.uniform1f(currentObj.shaderProgram.uAxisIndex, 3.0);
		in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.refSysPositionZBuffer);
		in_gl.bufferData(in_gl.ARRAY_BUFFER, currentObj.refSysPositionZ, in_gl.STATIC_DRAW);
		in_gl.vertexAttribPointer(currentObj.shaderProgram.vertexPositionAttribute, 3, in_gl.FLOAT, false, 0, 0);
		in_gl.enableVertexAttribArray(currentObj.shaderProgram.vertexPositionAttribute);
		in_gl.drawArrays(in_gl.LINE_STRIP, 0, 2);

	};
	
	this.draw = function(pMatrix, vMatrix){
		
		currentObj.enableBuffer(pMatrix, vMatrix);
		
	};
	
	this.localInit();
	this.initShaders();
	this.initBuffer();
	
	
}