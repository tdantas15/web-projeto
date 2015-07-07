var express = require('express');
var app = express();
var pg = require('pg');
var hbs = require('express-hbs');
var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/supermercado';
app.set('port', (process.env.PORT || 3000));

var sess = {
  secret: 'keyboard cat',
  cookie: { secure: false}
};

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  findOrCreateUser(user.nome, user.google_id, function(user){
    done(null, user);
  });
});

app.use(session(sess));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/style", express.static(__dirname + '/views/style'));
app.use("/img", express.static(__dirname + '/views/imgs'));
app.use("/fonts", express.static(__dirname + '/views/fonts'));
app.use("/produtos", express.static(__dirname + '/temporaryDbContents'));
app.engine('hbs', hbs.express4({
  defaultLayout: __dirname +"/views/layouts/main.hbs"
}));
app.set('view engine', 'hbs');
app.use(passport.initialize());
app.use(passport.session());


passport.use(new GoogleStrategy({
    clientID:     "1046465514072-fcviu9lgrrba8kijtg45bffv0hpuur0g.apps.googleusercontent.com",
    clientSecret: "Db8alN06xD6lJfIftlaLdwf1",
    callbackURL: "http://young-cove-1583.herokuapp.com/auth/google/callback",
    //callbackURL: "http://www.eskimo.com.br:3000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    var user = findOrCreateUser( profile.name.givenName, profile.id, function(user){
      return done(null, user);
    } );
  }
));

var server = app.listen(app.get('port'), function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Supermercado app listening at http://%s:%s', host, port);

});

var findOrCreateUser = function(name, googleId, callback){

  var data = [googleId, name];
  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var query = client.query("SELECT * FROM usuarios WHERE google_id = $1", [data[0]]);
      query.on('row', function(row) {

          results.push(row);
      });

      query.on('end', function() {
          if (results.length == 0) {
            var queryInsert = client.query("INSERT INTO usuarios (google_id, nome) values ($1, $2)", data);

            queryInsert.on('end', function() {
                client.end();
                findOrCreateUser(data[1], data[0], callback);
            });
          } else {
            client.end();
            callback(results[0]);
          }
      });

      if(err) {
        console.log(err);
      }


    })

};



//login
app.get('/auth/google',
  passport.authenticate('google', { scope:
    [ 'https://www.googleapis.com/auth/plus.login',
    , 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }
));

app.get( '/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/',
        failureRedirect: '/'
}));

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.get('/', function(req, res){
  res.redirect('/produtos');
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
          res.render('index', {produtos: results, user: req.user});
      });

      if(err) {
        console.log(err);
      }

  });
});

app.get('/produtos/new', function(req, res){
  res.render('novo_produto', {user: req.user});
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

app.post('/search', function(req, res){
  var results = [];
  var data = req.body;

  pg.connect(connectionString, function(err, client, done) {
      query = client.query("SELECT * FROM produtos WHERE UPPER(produtos.nome) LIKE " + "UPPER('%"+data.nome+"%')");

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          console.log(results);
          res.render('index', {produtos: results, user: req.user});
      });

      if(err) {
        console.log(err);
      }

  });
});


app.get('/cart', function(req, res){

  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var query = client.query("SELECT * FROM CARRINHOS INNER JOIN PRODUTOS ON PRODUTOS.ID = CARRINHOS.PRODUTO_ID WHERE USUARIO_ID = $1",[req.user.id]);

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          res.render('cart', {produtos: results, user: req.user});
      });

      if(err) {
        console.log(err);
      }

  });
});

app.post('/produtos/:id/cart', function(req, res){

  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var query = client.query("INSERT INTO CARRINHOS (USUARIO_ID, PRODUTO_ID, QUANTIDADE) VALUES ($1,$2,$3)",[req.user.id, req.params.id, req.body.quantidade]);

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          res.redirect('/cart');
      });

      if(err) {
        console.log(err);
      }

  });
});

app.post('/cart/:id', function(req, res){

  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var query = client.query("UPDATE CARRINHOS SET quantidade = $1 WHERE ID = $1",[req.body.quantidade, req.params.id]);

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          res.render('cart', {produtos: results, user: req.user});
      });

      if(err) {
        console.log(err);
      }

  });
});

app.get('/produto/:id', function(req, res){

  pg.connect(connectionString, function(err, client, done) {

      var results = [];
      var query = client.query("SELECT * FROM produtos WHERE produtos.id=$1",[req.params.id]);

      query.on('row', function(row) {
          results.push(row);
      });

      query.on('end', function() {
          client.end();
          res.render('produto', {produtos: results , user: req.user});
      });

      if(err) {
        console.log(err);
      }

  });
});
