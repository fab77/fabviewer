/**
 * @author Fabrizio Giordano (Fab)
 * @param in_radius - number
 * @param in_gl - GL context
 * @param in_position - array of double e.g. [0.0, 0.0, -7]
 * @param in_xRad - X rotation in radians
 * @param in_yRad - Y rotation in radians
 */
function Moon(in_radius, in_gl, in_canvas, in_position, in_xRad, in_yRad, in_name, in_fovUtils){
	
	AbstractSkyEntity.call(this, in_radius, in_gl, in_canvas, in_position, in_xRad, in_yRad, in_name, in_fovUtils);
	var currentObj = this;
//	console.log(currentObj);
	
	
	this.initShaders = function () {
		var fragmentShader = getShader("moon-shader-fs");
		var vertexShader = getShader("moon-shader-vs");

		in_gl.attachShader(currentObj.shaderProgram, vertexShader);
		in_gl.attachShader(currentObj.shaderProgram, fragmentShader);
		in_gl.linkProgram(currentObj.shaderProgram);

		if (!in_gl.getProgramParameter(currentObj.shaderProgram, in_gl.LINK_STATUS)) {
			alert("Could not initialise shaders");
		}

		
		shaderUtility.useProgram(currentObj.shaderProgram);

		currentObj.shaderProgram.vertexPositionAttribute = in_gl.getAttribLocation(currentObj.shaderProgram, "aVertexPosition");
		in_gl.enableVertexAttribArray(currentObj.shaderProgram.vertexPositionAttribute);

		currentObj.shaderProgram.textureCoordAttribute = in_gl.getAttribLocation(currentObj.shaderProgram, "aTextureCoord");
		in_gl.enableVertexAttribArray(currentObj.shaderProgram.textureCoordAttribute);

//		currentObj.shaderProgram.vertexNormalAttribute = in_gl.getAttribLocation(currentObj.shaderProgram, "aVertexNormal");
//		in_gl.enableVertexAttribArray(currentObj.shaderProgram.vertexNormalAttribute);

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
		currentObj.shaderProgram.samplerUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uSampler");
	};
	
	this.initBuffer = function () {
		var vertexPositionData = [];
		var normalData = [];
		var textureCoordData = [];
		var indexData = [];

		var latitudeBands = 30;
	    var longitudeBands = 30;

	    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
	        var theta = latNumber * Math.PI / latitudeBands;
	        var sinTheta = Math.sin(theta);
	        var cosTheta = Math.cos(theta);

	        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
	            var phi = longNumber * 2 * Math.PI / longitudeBands;
	            var sinPhi = Math.sin(phi);
	            var cosPhi = Math.cos(phi);

	            var x = cosPhi * sinTheta;
	            var y = cosTheta;
	            var z = sinPhi * sinTheta;
	            var u = 1 - (longNumber / longitudeBands);
	            var v = 1 - (latNumber / latitudeBands);

	            normalData.push(x);
	            normalData.push(y);
	            normalData.push(z);

	            textureCoordData.push(u);
	            textureCoordData.push(v);

	            vertexPositionData.push(in_radius * x);
	            vertexPositionData.push(in_radius * y);
	            vertexPositionData.push(in_radius * z);
	        }
	    }

	    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
	        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
	            var first = (latNumber * (longitudeBands + 1)) + longNumber;
	            var second = first + longitudeBands + 1;

	            indexData.push(first);
	            indexData.push(second);
	            indexData.push(first + 1);

	            indexData.push(second);
	            indexData.push(second + 1);
	            indexData.push(first + 1);
	        }
	    }

//	    currentObj.vertexNormalBuffer = in_gl.createBuffer();
	    
//	    in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.vertexNormalBuffer);
//	    in_gl.bufferData(in_gl.ARRAY_BUFFER, new Float32Array(normalData), in_gl.STATIC_DRAW);
//	    currentObj.vertexNormalBuffer.itemSize = 3;
//	    currentObj.vertexNormalBuffer.numItems = normalData.length / 3;

	    in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.vertexTextureCoordBuffer);
	    in_gl.bufferData(in_gl.ARRAY_BUFFER, new Float32Array(textureCoordData), in_gl.STATIC_DRAW);
	    currentObj.vertexTextureCoordBuffer.itemSize = 2;
	    currentObj.vertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

	    in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.vertexPositionBuffer);
	    in_gl.bufferData(in_gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), in_gl.STATIC_DRAW);
	    currentObj.vertexPositionBuffer.itemSize = 3;
	    currentObj.vertexPositionBuffer.numItems = vertexPositionData.length / 3;

	    in_gl.bindBuffer(in_gl.ELEMENT_ARRAY_BUFFER, currentObj.vertexIndexBuffer);
	    in_gl.bufferData(in_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), in_gl.STATIC_DRAW);
	    currentObj.vertexIndexBuffer.itemSize = 1;
	    currentObj.vertexIndexBuffer.numItems = indexData.length;
	    
	};
	
	this.initTexture = function () {
	    
		currentObj.textures[0] = in_gl.createTexture();
		
		
		currentObj.textures[0].image = new Image();
		currentObj.textures[0].image.setAttribute('crossorigin', 'anonymous');
	    
		currentObj.textures[0].image.onload = function () {
	        
	    	handleLoadedTexture(currentObj.textures[0]);
	    
	    };
	    // WARNING this way it doesn't work. use the above instead
		//	    currentObj.textures[0].image.onload = function (texture) {
		//	    	handleLoadedTexture(texture);
		//	    }(currentObj.textures[0]);
	    
	    currentObj.textures[0].image.src = "moon.gif";
	    
	    function handleLoadedTexture (texture){
			
	        texture.image.setAttribute('crossorigin', 'anonymous');
			in_gl.pixelStorei(in_gl.UNPACK_FLIP_Y_WEBGL, true);
	        in_gl.bindTexture(in_gl.TEXTURE_2D, texture);
	        in_gl.texImage2D(in_gl.TEXTURE_2D, 0, in_gl.RGBA, in_gl.RGBA, in_gl.UNSIGNED_BYTE, texture.image);
	        in_gl.texParameteri(in_gl.TEXTURE_2D, in_gl.TEXTURE_MAG_FILTER, in_gl.LINEAR);
	        in_gl.texParameteri(in_gl.TEXTURE_2D, in_gl.TEXTURE_MIN_FILTER, in_gl.LINEAR_MIPMAP_NEAREST);
	        in_gl.generateMipmap(in_gl.TEXTURE_2D);
	        in_gl.bindTexture(in_gl.TEXTURE_2D, null);
		}
	    
	};
	
	this.draw = function(pMatrix, vMatrix){

		shaderUtility.useProgram(currentObj.shaderProgram);
		
		currentObj.shaderProgram.pMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uPMatrix");
		currentObj.shaderProgram.mMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uMMatrix");
		currentObj.shaderProgram.vMatrixUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uVMatrix");
		currentObj.shaderProgram.samplerUniform = in_gl.getUniformLocation(currentObj.shaderProgram, "uSampler");
		currentObj.shaderProgram.vertexPositionAttribute = in_gl.getAttribLocation(currentObj.shaderProgram, "aVertexPosition");
		currentObj.shaderProgram.textureCoordAttribute = in_gl.getAttribLocation(currentObj.shaderProgram, "aTextureCoord");

		in_gl.uniformMatrix4fv(currentObj.shaderProgram.mMatrixUniform, false, currentObj.modelMatrix);
		in_gl.uniformMatrix4fv(currentObj.shaderProgram.pMatrixUniform, false, pMatrix);
		in_gl.uniformMatrix4fv(currentObj.shaderProgram.vMatrixUniform, false, vMatrix);
		
		in_gl.activeTexture(in_gl.TEXTURE0);
		in_gl.bindTexture(in_gl.TEXTURE_2D, currentObj.textures[0]);
		in_gl.uniform1i(currentObj.shaderProgram.samplerUniform, 0);
		
		in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.vertexPositionBuffer);
		in_gl.vertexAttribPointer(currentObj.shaderProgram.vertexPositionAttribute, currentObj.vertexPositionBuffer.itemSize, in_gl.FLOAT, false, 0, 0);
		
		in_gl.bindBuffer(in_gl.ARRAY_BUFFER, currentObj.vertexTextureCoordBuffer);
		in_gl.vertexAttribPointer(currentObj.shaderProgram.textureCoordAttribute, currentObj.vertexTextureCoordBuffer.itemSize, in_gl.FLOAT, false, 0, 0);
		
	    in_gl.bindBuffer(in_gl.ELEMENT_ARRAY_BUFFER, currentObj.vertexIndexBuffer);
	    
	    in_gl.enableVertexAttribArray(currentObj.shaderProgram.vertexPositionAttribute);
		in_gl.enableVertexAttribArray(currentObj.shaderProgram.textureCoordAttribute);
		
		in_gl.drawElements(in_gl.TRIANGLES, currentObj.vertexIndexBuffer.numItems, in_gl.UNSIGNED_SHORT, 0);	
		
			
	};
	
	this.initShaders();
	this.initBuffer();
	this.initTexture();
	

}