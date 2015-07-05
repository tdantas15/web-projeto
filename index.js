var express = require('express');
var app = express();
var pg = require('pg');
var hbs = require('express-hbs');
var fs = require('fs');
var bodyParser = require('body-parser')
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/supermercado';
app.set('port', (process.env.PORT || 3000));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/style", express.static(__dirname + '/views/style'));
app.use("/fonts", express.static(__dirname + '/views/fonts'));
app.engine('hbs', hbs.express4({
  defaultLayout: __dirname +"/views/layouts/main.hbs"
}));
app.set('view engine', 'hbs');


var server = app.listen(app.get('port'), function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Supermercado app listening at http://%s:%s', host, port);

});

app.get('/', function(req, res){
  res.redirect('/produtos')
});

app.get('/produtos', function(req, res){

  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var query = client.query("SELECT * FROM produtos");

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          res.render('index', {produtos: results});
      });

      if(err) {
        console.log(err);
      }

  });
});

app.get('/produtos/new', function(req, res){
  res.render('novo_produto');
});

app.post('/produtos', function(req, res){
  var results = [];
  var data = req.body;

  pg.connect(connectionString, function(err, client, done) {
      query = client.query("INSERT INTO produtos(nome, preco, descricao, imagem) values($1, $2, $3, $4)", [data.nome, data.preco, data.descricao, data.imagem]);
      query.on('end', function() {
          client.end();
          res.redirect('/produtos');
      });

      if(err) {
        console.log(err);
      }

  });
});
