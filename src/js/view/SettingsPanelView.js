
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
            }
        }
        return _public;
    }		

    init(insideSphere){
        this._visible = false;
        this._html = $("<div id='settingsPanel'>"
        + "<div id='fps'>"
        + "<table style='width: 100%; text-align: center;'>" 
        + "	<tr>"
        + "	<th>FPS</th>"
        + "	<th>Avg FPS</th>" 
        + "</tr><tr>"
        + "	<td><div id='fpsvalue'></div></td>"
        + "	<td><div id='avgfpsvalue'></div></td>" 
        + "</tr>"
        + "</table></div>" 
        + "<br> <input type='checkbox' checked='" + insideSphere + "' id='inside-sphere-checkbox' style='vertical-align: middle;'></input><label for='inside-sphere-checkbox'>Inside Sphere</label>"
        + "<br> <input type='checkbox' id='healpix-grid-checkbox' style='vertical-align: middle;'></input><label for='healpix-grid-checkbox'>Healpix Grid</label>"

        + "<div id='getFovPoly' class='button' >getFovPoly</div>"


        + "<div id='coords'>"
        + "<span><i>Spherical coords:</i></span> <br> <span>phi</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>theta</span>"
        + "<br> <span id='phi'></span>&nbsp; &nbsp;<span id='theta'></span>"
        + "</div>"
        + "</div>");
        this._html.css("display","none");
    }

}

export default SettingsPanelView;