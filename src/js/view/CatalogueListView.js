
import $ from "jquery";
class CatalogueListView{
 
	
    constructor(){
        
    	this.html;
        
    	this.init();
        
    	var _public = {
            getHtml: ()=>{
                return this.html;
            },
            addCatalogue: (catalogueView)=>{
                this.html.find("#catalogueList").append(catalogueView.getHtml());
            }
        }
     
        return _public;
    }
 
    init(){
//        this.html = $("<div ><ul id='catalogueList' class='catalogueListPanel'></ul></div>");
//        this.html.css("height","150px");
//        this.html.css("overflow", "scroll");
        
    }
 
}

export default CatalogueListView;