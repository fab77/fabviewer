
import $ from "jquery";
class HiPSListView{
 
    constructor(){
        this.html;
        this.init();
        var _public = {
            getHtml: ()=>{
                return this.html;
            },
            addHiPS: (hipsView)=>{
//                this.html.find("#hipsList").append(hipsView.getHtml());
                $("#hipsList").append(hipsView.getHtml());
            }
        }
     
        return _public;
    }
 
    init(){
//    	this.html = $("<div ><ul id='hipsList'></ul></div>");
    	this.html = $("<div id='hipsList'><table></table></div>");
        this.html.css("height","150px");
        this.html.css("overflow", "scroll");
        
    }
 
}

export default HiPSListView;