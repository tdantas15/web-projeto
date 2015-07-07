var initializeRemoveFromCart = function(){
  var elements = document.getElementsByClassName("remove_item_button");
  for (var i=0; i<elements.length;i++){
    elements[i].addEventListener("click", function(e) {
      var xmlhttp = new XMLHttpRequest();
      var element = this;
      xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState==4 ){
          document.getElementById(element.id).parentNode.parentNode.remove();
        }
      };
      xmlhttp.open("DELETE", "/cart/" + this.id, true);
      xmlhttp.send();
    }.bind(elements[i]));
  }
};
