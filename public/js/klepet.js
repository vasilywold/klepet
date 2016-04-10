var Klepet = function(socket) {
  this.socket = socket;
};

Klepet.prototype.posljiSporocilo = function(kanal, besedilo) {
  var sporocilo = {
    kanal: kanal,
    besedilo: besedilo
  };
  this.socket.emit('sporocilo', sporocilo);
};

Klepet.prototype.spremeniKanal = function(kanal) {
  this.socket.emit('pridruzitevZahteva', {
    novKanal: kanal
  });
};

var u = "uuuuuuuuuuuu";

Klepet.prototype.procesirajUkaz = function(ukaz) {
  var besede = ukaz.split(' ');
  ukaz = besede[0].substring(1, besede[0].length).toLowerCase();
  var sporocilo = false;

  switch(ukaz) {
    case 'dregljaj':
      besede.shift();
      var besedilo = besede.join(' ');
      /*console.log("Inside besedilo: " + besedilo);
      console.log("Inside besede: " + besede);
      console.log("Inside parametri: " + parametri);*/
      var parametri = besedilo.split('\"');
      parametri = besede;
      besede = "";
      //execute order
      if(parametri){
        this.socket.emit('sporocilo',{ vzdevek: besedilo, besedilo: besede});
        this.socket.emit('dregljaj',{ vzdevek: besedilo, besedilo: besede});
        sporocilo = "Dregljaj za " + parametri[0];
      }else{
        sporocilo = 'Neznan ukaz';
      }
      break;
    case 'pridruzitev':
      besede.shift();
      var kanal = besede.join(' ');
      this.spremeniKanal(kanal);
      break;
    case 'vzdevek':
      besede.shift();
      var vzdevek = besede.join(' ');
      this.socket.emit('vzdevekSpremembaZahteva', vzdevek);
      break;
    case 'zasebno':
      besede.shift();
      var besedilo = besede.join(' ');
      var parametri = besedilo.split('\"');
      if (parametri) {
        this.socket.emit('sporocilo', { vzdevek: parametri[1], besedilo: parametri[3] });
        sporocilo = '(zasebno za ' + parametri[1] + '): ' + parametri[3];
      } else {
        sporocilo = 'Neznan ukaz';
      }
      break;
    default:
      sporocilo = 'Neznan ukaz.';
      break;
  };

  return sporocilo;
};
