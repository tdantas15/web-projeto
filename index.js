var express = require('express');
var app = express();
var pg = require('pg');
var hbs = require('express-hbs');
var fs = require('fs');

app.engine('hbs', hbs.express4({
  partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');

app.get('/', function(req, res){
  res.render('index');
});


var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
