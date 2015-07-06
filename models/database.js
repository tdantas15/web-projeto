var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/supermercado';

var client = new pg.Client(connectionString);
client.connect();
client.query('DROP TABLE IF EXISTS carrinhos').on('end', function() {
  client.query('DROP TABLE IF EXISTS produtos').on('end', function(){
    client.query('DROP TABLE IF EXISTS usuarios').on('end', function(){
      client.query('CREATE TABLE produtos(id SERIAL PRIMARY KEY, nome VARCHAR(40) not null, preco real not null, descricao VARCHAR(800) not null, imagem VARCHAR(200) not null)').on('end', function(){
        client.query('CREATE TABLE usuarios(id SERIAL PRIMARY KEY, nome VARCHAR(800) not null, google_id  VARCHAR(800) not null)').on('end', function(){
          client.query('CREATE TABLE carrinhos(id SERIAL PRIMARY KEY, usuario_id integer REFERENCES usuarios(id), produto_id integer REFERENCES produtos(id), quantidade integer)').on('end', function(){
              client.end();
          })
        })
      })
    })
  })
})
