
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
                $("#hipsList").append(hipsView.getHtml());
            },
            toggle: ()=>{
                this.html.toggle();
            }
        }
     
        return _public;
    }
 
    init(){
        this.html = $("<div id='hipsList'></div>");
        this.html.css("position","absolute");
        this.html.css("top","5%");
        this.html.css("left","121%");
        this.html.css("border","1px solid black");
        this.html.css("background-color","rgba(255, 255, 255, .15)");
        this.html.css("backdrop-filter","blur(5px)");
        this.html.css("color","#A5F6F1");
        this.html.css("cursor","move");
        this.html.find("#close-hips-settings").on('click', ()=>{
            this.detach();
        });



        this.html.hide();
    }

 
}

export default HiPSListView;