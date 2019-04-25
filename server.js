Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

var http = require('http');
var path = require('path');

var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'src')));

let users = [];
let admin;
let ronda = 0;
let rondas = 3;
let perguntas = 3;
io.on('connection', function (socket) {
  socket.store.pts = 0;
  socket.store.ptsEpoch = [];
  users.push(socket);
  
  socket.on('disconnect', function () {
    users.splice(users.indexOf(socket), 1);
    updateRoster();
  });

  socket.on('identify', function (name) {
      socket.store.nome = String(name || 'Bacano');
      updateRoster();
  });

  socket.on('setAdmin', function() {
    admin = socket;
    users.splice(users.indexOf(socket), 1);
    updateRoster();
  });

  socket.on('setSettings', function(obj) {
    rondas = obj.rondas;
    perguntas = obj.perguntas;
  });

  socket.on('comecaojogobichooo', function() {
    users.forEach(u => {
      u.store.pts = 0;
      u.store.ptsEpoch = [];
    });
    updateRoster();

    broadcast('definemsgQuestoes', '');
    broadcast('definemsgTema', 'À espera de um tema...');
    pegaTema();
  });

  socket.on('temaEscolhido', function(tema) {
    broadcast('definemsgTema', '');
    pegaPerguntas(tema);
    temas.splice(temas.indexOf(tema), 1);
    ronda++;
  });

  socket.on('acertei', function() {
    socket.store.pts++;      
    socket.store.ptsEpoch.push(Date.now());
    updateRoster();
  });
});

var data = require('./data.json');
var temas = Object.keys(data);
function pegaTema() {
  if(ronda === rondas) {
    broadcast('definemsgQuestoes', 'Aguarde pelo administrador...');
    setTimeout(() => {
      broadcast('acabaJogo', getRoster());
      ronda = 0;
      admin.emit('boraoutromeuu');
    }, 1000);
    return;
  }

  let s = users[Math.floor(Math.random() * users.length)];
  s.emit('escolherTema', temas);
}

var qtdPerguntas = 0;
function pegaPerguntas(tema) {
  let idx, len = users.length, obj = data[tema][Math.floor(Math.random() * data[tema].length)], a, q;

  if(!obj)
    return pegaTema();

  q = obj.q
  for(idx=0; idx<len; idx++) {
    a = [...obj.a];
    a.shuffle();
    users[idx].emit('perguntas', {q, a});
  }

  data[tema].splice(obj, 1);

  setTimeout(() => {
    broadcast('acabarPergunta', obj.a[0]);
    qtdPerguntas++;

    if(qtdPerguntas % perguntas === 0) {
      pegaTema();
    } else {
      setTimeout(() => {
        //mostra curiosidade
        pegaPerguntas(tema);
      }, 3000);
    }
  }, 6300);
}

function getRoster() {
  let arr = [], proc = [];

  users.forEach(u => {
    arr.push({name: u.store.nome, pts: u.store.pts, ptsEpoch: u.store.ptsEpoch});
  });

  arr.sort((a, b) => {
    if(a.pts === b.pts && a.pts !== 0)
      return a.ptsEpoch.reduce((prev, curr) => { return prev+curr }) - b.ptsEpoch.reduce((prev, curr) => { return prev+curr });
    else
      return b.pts - a.pts;
  });

  arr.forEach((val, idx) => {
    proc.push(`${idx+1}º ${val.name} (${val.pts})`);
  });

  return proc;
}

function updateRoster() {
  if(admin)
    admin.emit('rosterUpdate', getRoster());
}

function broadcast(event, data) {
  users.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 80, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Listening at", addr.address + ":" + addr.port);
});