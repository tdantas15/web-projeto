var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/supermercado';

/*var client = new pg.Client(connectionString);
client.connect();
var query = client.query('DROP TABLE usuarios');
query.on('end', function() { client.end(); });*/

/*var client = new pg.Client(connectionString);
client.connect();
var query = client.query('DROP TABLE usuarios');
query.on('end', function() { client.end(); });*/


/*var client = new pg.Client(connectionString);
client.connect();
var query = client.query('CREATE TABLE produtos(id SERIAL PRIMARY KEY, nome VARCHAR(40) not null, preco real not null, descricao VARCHAR(800) not null, imagem VARCHAR(200) not null)');
query.on('end', function() { client.end(); });*/

var client = new pg.Client(connectionString);
client.connect();
var query = client.query('CREATE TABLE usuarios(id SERIAL PRIMARY KEY, nome VARCHAR(800) not null, google_id  VARCHAR(800) not null)');
query.on('end', function() { client.end(); });
