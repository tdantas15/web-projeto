var express = require('express');
var app = express();
var pg = require('pg');
var hbs = require('express-hbs');
var fs = require('fs');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/supermercado';

app.engine('hbs', hbs.express4({
  partialsDir: __dirname + '/views/partials', defaultLayout: __dirname +"/views/layouts/main.hbs"
}));
app.set('view engine', 'hbs');

app.get('/', function(req, res){
  res.render('index');
});

app.get('/produtos', function(req, res){
  console.log("GET /produtos");
  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var query = client.query("SELECT * FROM produtos");

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          return res.json(results);
      });

      if(err) {
        console.log(err);
      }

  });
});

app.post('/produtos', function(req, res){
  console.log("POST /produtos");
  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var data = {text: req.body.text, complete: false};
      client.query("INSERT INTO produtos(nome, preco, descricao, imagem) values($1, $2, $3, $4)", [data.nome, data.preco, data.descricao, data.imagem]);

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          return res.json(results);
      });

      if(err) {
        console.log(err);
      }

  });
});


var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
