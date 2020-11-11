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
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
    }

    addTile(tile){
        let i = tile.index - this.batchIndex * this.tilesPerTexture;
        let ix = i % this.tilesPerRow;
        let iy = Math.floor(i / this.tilesPerRow);
        let size = 1.0 / this.tilesPerRow;

        let tileTextureCoordinates = new Float32Array(8);
        tileTextureCoordinates[0] = (ix + 1.0) * size - this.halfPixelCorrection;
        tileTextureCoordinates[1] = iy*size + this.halfPixelCorrection;
        tileTextureCoordinates[2] = (ix + 1.0) * size - this.halfPixelCorrection;
        tileTextureCoordinates[3] = (iy + 1.0) * size - this.halfPixelCorrection;
        tileTextureCoordinates[4] = ix*size + this.halfPixelCorrection;
        tileTextureCoordinates[5] = (iy + 1.0) * size - this.halfPixelCorrection;
        tileTextureCoordinates[6] = ix*size + this.halfPixelCorrection;
        tileTextureCoordinates[7] = iy*size + this.halfPixelCorrection;

        let tileVertexIndices = new Uint16Array(6);
        let baseFaceIndex = 4 * i + this.batchIndex * this.tilesPerTexture * 4;
        tileVertexIndices[0] = baseFaceIndex;
        tileVertexIndices[1] = baseFaceIndex + 1;
        tileVertexIndices[2] = baseFaceIndex + 2;
        tileVertexIndices[3] = baseFaceIndex;
        tileVertexIndices[4] = baseFaceIndex + 2;
        tileVertexIndices[5] = baseFaceIndex + 3;

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

    writeToBuffer(i, tile, tileTextureCoordinates, tileVertexIndices) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        index = 12 * i + this.batchIndex * this.tilesPerTexture * 12;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, index * Float32Array.BYTES_PER_ELEMENT, tile.vertexPosition);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = tile.vertexPosition.length;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        let index = 8 * i + this.batchIndex * this.tilesPerTexture * 8;
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, index * Float32Array.BYTES_PER_ELEMENT, tileTextureCoordinates);
        this.vertexTextureCoordBuffer.itemSize = 2;
        this.vertexTextureCoordBuffer.numItems = tileTextureCoordinates.length;

        index = 6 * i + this.batchIndex * this.tilesPerTexture * 6;
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, index * Uint16Array.BYTES_PER_ELEMENT, tileVertexIndices);
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
        let drawsPerTexture = 6 * this.tilesToDraw;
        if(this.useMipmap){
            drawsPerTexture = 6 * this.tilesToDrawAtLastMipmapCreation;
        }
        this.gl.activeTexture(this.gl.TEXTURE0 + this.texturePositionToBindTo);
        if(this.texturePositionToBindTo == MAX_TEXTURE_POSITION){
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }
        this.gl.uniform1i(sampler, this.texturePositionToBindTo);
        this.gl.drawElements(this.gl.TRIANGLES, drawsPerTexture, this.gl.UNSIGNED_SHORT, this.tilesPerTexture * 12 * this.batchIndex);
    }
}
export default BatchOfTiles;