/**
 * @author Fabrizio Giordano (Fab)
 */
"use strict";

import SystemEntity from '../model/SystemEntity';

class SystemPresenter{
    constructor(_view){
        this.init(_view);
        var _public = {
            constructor: (in_view) =>{
                this.constructor(in_view);
            },

            getView: ()=>{
                return this.view;
            },
    //        setModel: function(_model){	// of type SystemEntity
    //            model = _model;
    //            view.setModel(model);
    //        },
            refreshModel: ()=>{
                
                this.setModel();
                this.view.setModel(this.model);
                
            },
            getElapsedTime: ()=>{
                return this.elapsedTime;
            },
            getFovPoly: function(){
                
            },
            addFovPolyHandler: (handler)=>{
                this.view.addFovPolyHandler(function(){
                    // TODO call FovUtils.getFovPoly()
                    handler();
                    
                });
            }
            
        }
     
        return _public;
    }

    init(_view){
//    	console.log("SystemPresenter.init()");
        this.view = _view;
//        view.addFovPolyHandler(function(){
//            // TODO call FovUtils.getFovPoly()
//        	console.log("TODO call FovUtils.getFovPoly()");
//        	
//        });
        this.frameTimes = [];
        this.frameCursor = 0;
        this.numFrames = 0;   
        this.maxFrames = 20;
        this.totalFPS = 0;
        this.fps = 0;
        var now = (new Date()).getTime() * 0.001;
        this.lastDrawTime = now;
        this.model = new SystemEntity();
        this.updateFpsInteger = 0;
        
    }
    
    setModel(){
        this.updateFpsInteger++;
        if(this.updateFpsInteger % 50 == 0){
    	
            var now = (new Date()).getTime() * 0.001;
            
            this.elapsedTime = now - this.lastDrawTime;
            this.lastDrawTime = now;
            
            this.fps = 50 / this.elapsedTime;

            // add the current fps and remove the oldest fps
            this.totalFPS += this.fps - (this.frameTimes[this.frameCursor] || 0);
            // record the newest fps
            this.frameTimes[this.frameCursor++] = this.fps;
            // needed so the first N frames, before we have maxFrames, is correct.
            this.numFrames = Math.max(this.numFrames, this.frameCursor);
            // wrap the cursor
            this.frameCursor %= this.maxFrames;
            let averageFPS = this.totalFPS / this.numFrames;

            this.model.setFps(this.fps);
            this.model.setAvgFps(averageFPS);
        }
		

    }
}

export default SystemPresenter;