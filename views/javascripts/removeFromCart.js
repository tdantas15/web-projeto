var initializeRemoveFromCart = function(){
  updateCartTotal();
  var elements = document.getElementsByClassName("remove_item_button");
  for (var i=0; i<elements.length;i++){
    elements[i].addEventListener("click", function(e) {
      var xmlhttp = new XMLHttpRequest();
      var element = this;
      xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState==4 ){
          document.getElementById(element.id).parentNode.parentNode.remove();
          updateCartTotal();
        }
      };
      xmlhttp.open("DELETE", "/cart/" + this.id, true);
      xmlhttp.send();

    }.bind(elements[i]));
  }
};

var calcularQuantidade = function (){
  var soma = 0;
  var elements = document.getElementsByClassName("cart_quantity");
  for (var i=0; i<elements.length;i++){
    soma += parseInt(elements[i].textContent);
  }
  return soma;
}

var calcularPrecoTotal = function (){
  var soma = 0;
  var elements = document.getElementsByClassName("cart_price");
  var quantidades = document.getElementsByClassName("cart_quantity");
  for (var i=0; i<elements.length;i++){
    soma += (parseInt(elements[i].textContent.substr(2))) * parseInt(quantidades[i].textContent);
  }
  return soma;
}

var updateCartTotal = function (){
  var precoTotal = calcularPrecoTotal();
  var quantidade = calcularQuantidade();
  document.getElementById("cart_total").innerHTML = "Total ("+quantidade+"): R&#36;"+precoTotal;
}
