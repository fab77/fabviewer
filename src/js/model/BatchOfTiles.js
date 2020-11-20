"use strict";

import global from '../Global';

const N_PIXELS_PER_TILE = 512;
const MAX_TEXTURE_POSITION = 7;


class BatchOfTiles {

    constructor(tilesPerRow, batchIndex, vertexPositionBuffer, vertexTextureCoordBuffer, vertexIndexBuffer, useMipmap) {
        this.gl = global.gl;
        this.vertexPositionBuffer = vertexPositionBuffer;
        this.vertexTextureCoordBuffer = vertexTextureCoordBuffer;
        this.vertexIndexBuffer = vertexIndexBuffer;
        this.tilesPerRow = tilesPerRow;
        this.tilesPerTexture = tilesPerRow * tilesPerRow;
        this.batchIndex = batchIndex;
        this.useMipmap = useMipmap;
        this.texturePositionToBindTo = Math.min(MAX_TEXTURE_POSITION, batchIndex);
        this.halfPixelCorrection = 0.5 / (this.tilesPerRow * N_PIXELS_PER_TILE);
        
        this.changesToWriteToBuffer = [];
        this.createTexture();
        this.tilesToDraw = 0;
    }

    createTexture(){
        this.texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + this.texturePositionToBindTo);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA,
            this.tilesPerRow * N_PIXELS_PER_TILE,
            this.tilesPerRow * N_PIXELS_PER_TILE,
            0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
            new Uint8Array(4 * this.tilesPerTexture * N_PIXELS_PER_TILE * N_PIXELS_PER_TILE));
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        if(this.useMipmap){
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);// 4 times per pixel
            // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);// 8 times per pixel
            setInterval(()=> {this.updateMipmapAndWriteToBuffer();}, 300);
            this.anyMipmapCreated = false;
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        }
    }

    addTile(tile){
        let i = tile.index - this.batchIndex * this.tilesPerTexture;
        let ix = i % this.tilesPerRow;
        let iy = Math.floor(i / this.tilesPerRow);
        let size = 1.0 / this.tilesPerRow;

        let texturePosStartX = ix * size;
        let texturePosStartY = iy * size;

        let tileTextureCoordinates = new Float32Array(25*2);
        let index = 0;

        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartY;

        //5
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartY;

        //8
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 1.00 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartY;

        //11
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartY;
        //15
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.00 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartY;
        
        //19
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.75 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartY;
        //22
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.25 * size + texturePosStartY;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartX;
        tileTextureCoordinates[index++] = 0.50 * size + texturePosStartY;


        let tileVertexIndices = new Uint16Array(6*16);
        let baseFaceIndex = 25 * i + this.batchIndex * this.tilesPerTexture * 25;
        this.setVertexIndiciesFor25Points(tileVertexIndices, baseFaceIndex);

        this.gl.activeTexture(this.gl.TEXTURE0 + this.texturePositionToBindTo);
        if(this.texturePositionToBindTo == MAX_TEXTURE_POSITION){
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }
        this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, ix * N_PIXELS_PER_TILE, iy * N_PIXELS_PER_TILE,  this.gl.RGBA, this.gl.UNSIGNED_BYTE, tile.image);
        if(this.useMipmap){
            this.changesToWriteToBuffer.push({i: i, tile: tile, tileTextureCoordinates : tileTextureCoordinates, tileVertexIndices : tileVertexIndices});
        } else {
            this.writeToBuffer(i, tile, tileTextureCoordinates, tileVertexIndices);
        }

        this.updatedTexture = true;
        tile.textureLoaded = true;
        if(this.tilesToDraw < this.tilesPerTexture){
            this.tilesToDraw++;
        }
        if(this.useMipmap && !this.anyMipmapCreated){
            this.updateMipmapAndWriteToBuffer();
        }
    }

    setVertexIndiciesFor25Points(tileVertexIndices, baseFaceIndex){
        this.nextTileVertexIndexPosition = 0;

        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 0, baseFaceIndex + 1, baseFaceIndex + 16, baseFaceIndex + 15);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 1, baseFaceIndex + 2, baseFaceIndex + 17, baseFaceIndex + 16);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 2, baseFaceIndex + 3, baseFaceIndex + 18, baseFaceIndex + 17);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 3, baseFaceIndex + 4, baseFaceIndex + 5, baseFaceIndex + 18);

        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 15, baseFaceIndex + 16, baseFaceIndex + 23, baseFaceIndex + 14);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 16, baseFaceIndex + 17, baseFaceIndex + 24, baseFaceIndex + 23);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 17, baseFaceIndex + 18, baseFaceIndex + 19, baseFaceIndex + 24);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 18, baseFaceIndex + 5, baseFaceIndex + 6, baseFaceIndex + 19);
        
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 14, baseFaceIndex + 23, baseFaceIndex + 22, baseFaceIndex + 13);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 23, baseFaceIndex + 24, baseFaceIndex + 21, baseFaceIndex + 22);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 24, baseFaceIndex + 19, baseFaceIndex + 20, baseFaceIndex + 21);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 19, baseFaceIndex + 6, baseFaceIndex + 7, baseFaceIndex + 20);
        
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 13, baseFaceIndex + 22, baseFaceIndex + 11, baseFaceIndex + 12);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 22, baseFaceIndex + 21, baseFaceIndex + 10, baseFaceIndex + 11);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 21, baseFaceIndex + 20, baseFaceIndex + 9, baseFaceIndex + 10);
        this.setVertexIndexFor4Points(tileVertexIndices,
            baseFaceIndex + 20, baseFaceIndex + 7, baseFaceIndex + 8, baseFaceIndex + 9);
    }

    setVertexIndexFor4Points(tileVertexIndices, point0, point1, point2, point3){
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point0;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point1;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point2;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point0;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point2;
        tileVertexIndices[this.nextTileVertexIndexPosition++] = point3;
    }

    writeToBuffer(i, tile, tileTextureCoordinates, tileVertexIndices) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        let offset = 3 * 25 * i + this.batchIndex * this.tilesPerTexture * 3 * 25;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offset * Float32Array.BYTES_PER_ELEMENT, tile.vertexPosition);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = tile.vertexPosition.length;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        offset = 2 * 25 * i + this.batchIndex * this.tilesPerTexture * 2 * 25;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offset * Float32Array.BYTES_PER_ELEMENT, tileTextureCoordinates);
        this.vertexTextureCoordBuffer.itemSize = 2;
        this.vertexTextureCoordBuffer.numItems = tileTextureCoordinates.length;

        offset = 16 * 6 * i + this.batchIndex * this.tilesPerTexture * 16 * 6;
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, offset * Uint16Array.BYTES_PER_ELEMENT, tileVertexIndices);
        this.vertexIndexBuffer.itemSize = 1;
        this.vertexIndexBuffer.numItems = tileVertexIndices.length;

        this.anythingToRender = true;
    }

    updateMipmapAndWriteToBuffer(){
        if(!this.updatedTexture){return;}
        if(DEBUG){
            console.log("mipmap Update - Batch: " + this.batchIndex);
        }
        this.gl.activeTexture(this.gl.TEXTURE0 + this.texturePositionToBindTo);
        if(this.texturePositionToBindTo == MAX_TEXTURE_POSITION){
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        this.changesToWriteToBuffer.forEach(element => {
            this.writeToBuffer(element.i, element.tile, element.tileTextureCoordinates, element.tileVertexIndices);
        });
        this.changesToWriteToBuffer = [];

        this.updatedTexture = false;
        this.anythingToRender = true;
        this.anyMipmapCreated = true;
        this.tilesToDrawAtLastMipmapCreation = this.tilesToDraw;
    }

    draw(sampler){
        if(!this.anythingToRender){return;}
        let drawsPerTexture = 16 * 6 * this.tilesToDraw;
        if(this.useMipmap){
            drawsPerTexture = 16 * 6 * this.tilesToDrawAtLastMipmapCreation;
        }
        this.gl.activeTexture(this.gl.TEXTURE0 + this.texturePositionToBindTo);
        if(this.texturePositionToBindTo == MAX_TEXTURE_POSITION){
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }
        this.gl.uniform1i(sampler, this.texturePositionToBindTo);
        this.gl.drawElements(this.gl.TRIANGLES, drawsPerTexture, this.gl.UNSIGNED_SHORT, Uint16Array.BYTES_PER_ELEMENT * 6 * 16 * this.tilesPerTexture * this.batchIndex);
    }
}
export default BatchOfTiles;