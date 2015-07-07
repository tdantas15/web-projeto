// requires
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
var methodOverride = require('method-override');
app.set('port', (process.env.PORT || 3000));

// Session configuration
var sess = {
  secret: 'keyboard cat',
  cookie: { secure: false}
};

// Passport Configuration
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  findOrCreateUser(user.nome, user.google_id, function(user){
    done(null, user);
  });
});

// Configurations
app.use(session(sess));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/style", express.static(__dirname + '/views/style'));
app.use("/img", express.static(__dirname + '/views/imgs'));
app.use("/javascripts", express.static(__dirname + '/views/javascripts'));
app.use("/fonts", express.static(__dirname + '/views/fonts'));
app.use("/img-produtos", express.static(__dirname + '/temporaryDbContents'));
app.engine('hbs', hbs.express4({
  defaultLayout: __dirname +"/views/layouts/main.hbs"
}));
app.set('view engine', 'hbs');
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// Google configuration
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

// Server start
var server = app.listen(app.get('port'), function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Supermercado app listening at http://%s:%s', host, port);
});

// Database methods
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

var findProductInCart = function(userId,productId){
  pg.connect(connectionString, function(err, client, done) {
      var results = [];
      var query = client.query("SELECT * FROM cart WHERE user_id = $1 and product_id = $2", [userId, productId]);
      query.on('row', function(row) {
          results.push(row);
      });
      query.on('end', function() {
        client.end();
        return results;
      });
      if(err) {
        console.log(err);
      }
    })
};

var updateProductInCart = function(cartId, quantidade, res){
  pg.connect(connectionString, function(err, client, done) {
      var query = client.query("UPDATE CARRINHOS SET quantidade = $1 WHERE ID = $2",[quantidade, cartId], function(err, result){
        if(err) {
          console.log(err);
        } else {
          client.end();
          res.redirect('/cart');
        }
      });
    });
};

var deleteCart = function(cartId, res){
  pg.connect(connectionString, function(err, client, done) {
    var query = client.query("DELETE FROM CARRINHOS WHERE ID = $1",[cartId], function(err, result){
      if(err) {
        console.log(err);
        res.status(500).send();
      } else {
        client.end();
        res.status(200).send();
      }
    });
  });
};

var deleteCartsFromUser = function(userId, res){
  pg.connect(connectionString, function(err, client, done) {
    var query = client.query("DELETE FROM CARRINHOS WHERE USUARIO_ID = $1",[userId], function(err, result){
      if(err) {
        console.log(err);
      } else {
        client.end();
        res.redirect('/cart');
      }
    });
  });
};

var addProductToCart = function(userId,productId, quantidade){
    pg.connect(connectionString, function(err, client, done) {
      var query = client.query("INSERT INTO CARRINHOS (USUARIO_ID, PRODUTO_ID, QUANTIDADE) VALUES ($1,$2,$3)",[userId, productId, quantidade], function(err, result){
        if(err) {
          console.log(err);
        } else {
          client.end();
        }
      });
    });
};

// Login paths
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
          res.render('index', {produtos: results, user: req.user});
      });
      if(err) {
        console.log(err);
      }
  });
});


app.get('/cart', function(req, res){
  if (req.user == undefined){
    res.redirect("/");
  } else {
    userId = req.user.id;
    pg.connect(connectionString, function(err, client, done) {
        var results = [];
        var query = client.query("SELECT * FROM PRODUTOS INNER JOIN CARRINHOS ON PRODUTOS.ID = CARRINHOS.PRODUTO_ID WHERE USUARIO_ID = $1",[userId]);
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
  }
});

app.post('/produtos/:id/cart', function(req, res){
  if (req.body.quantidade != "") {
    addProductToCart(req.user.id,req.params.id, req.body.quantidade);
    res.redirect('/cart');
  } else{
    res.redirect('/produto/'+req.params.id);
  }
});

app.put('/cart/:id', function(req, res){
  if (req.body.quantidade != "") {
    updateProductInCart(req.params.id, req.body.quantidade, res);
  } else {
    res.redirect('/cart');
  }
});

app.delete('/cart/:id', function(req, res){
  deleteCart(req.params.id, res);
});

app.post('/buy', function(req, res){
  deleteCartsFromUser(req.user.id, res);
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
