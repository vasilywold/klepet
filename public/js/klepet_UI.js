
function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

function najdiSlike(vhod){
  //regularExpression
  var regularExpression = new RegExp("(https?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg)|http?:\/\/[^ ]*\.(?:gif|png|jpg|jpeg))", 'gi');
  var slike = vhod.match(regularExpression);
  vhod = vhod.replace(regularExpression, function() {
    return " ";
  });
  besediloPoSlikah = vhod;
  return slike;
  
}

var besediloPoSlikah;
//doda nam vse slike na koncu. Kot html elemente
function spremeniSlikeVHTML(linki){
  //console.log(linki);
  var slike = [];
  for(var i in linki){
     var trenImg=document.createElement("img");
     trenImg.setAttribute('src', linki[i]);
     trenImg.style.width = '200px';
     trenImg.style.paddingLeft = '20px';
     slike.push(trenImg);
     //console.log("Are we in dodajSlike " + trenImg.outerHTML);
  }
  
  return slike;
}

var youtubeElementi;
function idFromYoutubeLink(url){
  var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = url.match(regExp);
  if (match && match[2].length == 11) {
    return match[2];
  } else {
    console.log("Napaka z URL-jem")
    return false;
  }
}

//precisti sporocilo, da ni vec linkov, poleg tega pa v spremenljivki youtubeElementi vrni iframe-e za sporocilo
function urediYoutube(sporocilo){
  //inicializiraj in isprazni seznam
  youtubeElementi = [];
  //dobi youtube link iz sporocila
  //var regularExpression = new RegExp("^(https\:/\/www\.youtube\.com\/watch)","gi");
  var regularExpression = new RegExp("\\bhttps\:/\/www\.youtube\.com\/watch\\S{13,15}\\b","gi");
  var linki = sporocilo.match(regularExpression);
  //pusti presledke na mestih linkov
  sporocilo = sporocilo.replace(regularExpression, function() {
    return " ";
  });
  //console.log("sporocilo: " + sporocilo);
  //console.log("linki: " + linki );
  //iz youtube linkov dobi id-je 
  //  spremeni v iframe elemente
   for(var i in  linki){
     //ta link je sedaj id
     linki[i] = idFromYoutubeLink(linki[i]);
     if(linki[i]==false) continue;
     //kreiramo iframe element
     var iframe = document.createElement('iframe');
     iframe.src = 'https://www.youtube.com/embed/'+linki[i];
     iframe.setAttribute('allowFullScreen', '');
     iframe.style.width = "200px";
     iframe.style.height = "150px";
     var currDiv = document.createElement('div');
     currDiv.style.paddingLeft = "20px";
     currDiv.appendChild(iframe);
     youtubeElementi.push(currDiv);
   }
    
    return sporocilo;

}

function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

//nastimaj pozicijo caret-a
function setCaretPosition(elemId, caretPos) {
    var elem = document.getElementById(elemId);

    if(elem != null) {
        if(elem.createTextRange) {
            var range = elem.createTextRange();
            range.move('character', caretPos);
            range.select();
        } else {
            if(elem.selectionStart) {
                elem.focus();
                elem.setSelectionRange(caretPos, caretPos);
            }
            else
                elem.focus();
        }
    }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  //procesirali bomo ta vnos pred dodajnjem smeškov, da nam to ne pokvari link-ov
  //console.log("Nasli slike: "+slike);
  //console.log("Besedilo je sedaj: "+sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;
  
    if (sporocilo.charAt(0) == '/') {
      sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    } else {
      
      sporocilo = filtirirajVulgarneBesede(sporocilo);
      klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
      
      var slike = najdiSlike(sporocilo);
      sporocilo = besediloPoSlikah;
      var sporocilo = urediYoutube(sporocilo);
      
      $('#sporocila').append(divElementEnostavniTekst(sporocilo));
      //dodajanje slik
      slike = spremeniSlikeVHTML(slike);
      for(var i in slike)
        $('#sporocila').append(slike[i]);
      //dodajanje youtube videov
      for(var i in youtubeElementi)
        $('#sporocila').append(youtubeElementi[i]);
      
      $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
      
    }
    $('#poslji-sporocilo').val('');
}


var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});


$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });


  socket.on('sporocilo', function (sporocilo) {
    //make life easier
    var sporocilo = sporocilo.besedilo;
    //najdemo slike ... in uredimo
    var slike = najdiSlike(sporocilo);
    var slike = spremeniSlikeVHTML(slike);
    var sporocilo = besediloPoSlikah;
  
    //naredi vse uzvezi z youtube elementi
    var sporocilo = urediYoutube(sporocilo);
    //naredi sporocilo iz filtriranega sporocila
    var novElement = divElementEnostavniTekst(sporocilo);
    //vse dodaj na board
    $('#sporocila').append(novElement);
    for(var i in slike)
      $('#sporocila').append(slike[i]);
    
    for(var i in youtubeElementi)
      $('#sporocila').append(youtubeElementi[i]);
    
    //dodelaj youtube zadeve

  });
  var demoTimeout;
  socket.on('dregljaj', function(sporocilo){
    var novElement = divElementEnostavniTekst("Dregljaj ");
    $('#sporocila').append(novElement);
    //console.log("V dregljaju");
    //rumble
    clearTimeout(demoTimeout);
    //inicializiraj jRumble
    $('#vsebina').jrumble();  
    //malo za hec
	  $('#vsebina').jrumble({
    	x: 6,
    	y: 6,
    	rotation: 6,
    	speed: 5,
    	opacity: true,
    	opacityMin: .05
    });

    $('#vsebina').trigger('startRumble');
	  demoTimeout = setTimeout(function(){$('#vsebina').trigger('stopRumble');}, 1500);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }
    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
    
  });



  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    //nas dodatek za uporabnike
    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val("/zasebno \""+ $(this).text() + "\" "+"\"\"");
      //console.log($('#poslji-sporocilo').val().length);
      setCaretPosition('poslji-sporocilo', $('#poslji-sporocilo').val().length - 1);
      //$('#poslji-sporocilo').focus();
      
    });
  });


  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);
  
  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
