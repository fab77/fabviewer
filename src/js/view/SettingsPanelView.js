
import $ from "jquery";
class SettingsPanelView{

    _html;
    _visible;
    
    constructor(insideSphere){
        
        this.init(insideSphere);
    
        var _public = {
            getHtml: ()=>{
                return this._html;
            },
            setModel : (model)=> {
                this._html.find("#fpsvalue").html(model.getFps());
                this._html.find("#avgfpsvalue").html(model.getAvgFps());
            },
            addFovPolyHandler : (handler) => {
                this._html.find("#getFovPoly").on("click", handler);
            },
            addHealpixGridCheckboxHandler:(handler)=>{
                this._html.find("#healpix-grid-checkbox").on("click", handler);
            },
        
            addInsideSphereCheckboxHandler: (handler)=>{
                this._html.find("#inside-sphere-checkbox").on("click", handler);
            },
            setSphericalCoordinates: (phiThetaDeg)=>{
                this._html.find("#phi").html(phiThetaDeg.phi.toFixed(4));
                this._html.find("#theta").html(phiThetaDeg.theta.toFixed(4));
            },
            toggle: ()=>{
                if (this._visible){
                    this._html.css("display","none");
                    this._visible = false;
                }else{
                    this._html.css("display","block");
                    this._visible = true;
                }
            },
            close: ()=>{
            	if (this._visible){
            		this._html.css("display","none");
            		this._visible = false;
            	}
            }
        }
        return _public;
    }		

    init(insideSphere){
        this._visible = false;
        let checked = "";
        if(insideSphere){
            checked = "checked";
        }
        this._html = $("<div id='settingsPanel' class='controlPanel'>"
        + "<div id='fps'>"
        + "<div style='display: grid; grid-template-columns: 50%; text-align: center; margin-bottom: 15px'>" 
        + "	<div>FPS</div>"
        + "	<div style='grid-column:2'>Avg FPS</div>" 
        + "	<div style='grid-row:2 grid-column:1' id='fpsvalue'></div>"
        + "	<div style='grid-row:2; grid-column:2' id='avgfpsvalue'></div>" 
        + "</div>" 


        + "<div id='sphericalCoordName'><i>Spherical coords</i></div>"
        + "<div id='coords'>"
        + "<span id='phiName'>phi</span>"
        +"<span id='thetaName'>theta</span>"
        + "<span id='phi'></span><span id='theta'></span>"
        + "</div>"

        + "<div class='settingsRow dataRow'> <input type='checkbox' " + checked + "' id='inside-sphere-checkbox' style='vertical-align: middle;'></input>"
        + "<label for='inside-sphere-checkbox'>Inside Sphere</label>"
        + "</div>"
        + "<div class='settingsRow dataRow'> <input type='checkbox' id='healpix-grid-checkbox' style='vertical-align: middle;'></input>"
        + "<label for='healpix-grid-checkbox'>Healpix Grid</label>"
        + "</div>"

        + "<div id='getFovPoly' class='button' >Log FoV Polygon</div>"


        + "</div>");
        this._html.css("display","none");
    }

}

export default SettingsPanelView;