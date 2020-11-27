
import $ from "jquery";
class FootprintListView{
 
    constructor(){
        this.html;
        this.init();
        var _public = {
            getHtml: ()=>{
                return this.html;
            },
            addFPSet: (footprintView)=>{
                this.html.find("#footprintList").append(footprintView.getHtml());
            }
        }
     
        return _public;
    }
 
    init(){
        this.html = $("<div ><ul id='footprintList'></ul></div>");
        this.html.css("height","150px");
        this.html.css("overflow", "scroll");
        
    }
 
}

export default FootprintListView;