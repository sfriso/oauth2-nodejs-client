const fs = require('fs')
const express = require('express');
//const session = require('express-session');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
const db = require("./dbManager");
const ejs = require("ejs");
const path = require("path");
const Request = require("request");
var bodyParser = require('body-parser');
const apiKey = require('./openweather.js');

let cookieParser = require('cookie-parser');
//const { SlowBuffer } = require('buffer');


const httpPort = 8081;
const httpsPort = 8443;

var privateKey = fs.readFileSync('certs/key-rsa.pem');
var certificate = fs.readFileSync('certs/cert.pem');
var credentials = {key: privateKey, cert: certificate};



//send to keycloack oauth2
const responseType = "code";
const clientID = "WeatherForecastAPP";
const state = "true";
const clientSecret = "QD9C2M8UQhzC22LXuHQ8kXyeEkIFBIcJ";
const callbackURL = "http://localhost:8081/oauth/redirect";
const callbackLogout = "http://localhost:8081/";

var accesstoken = "";
var refreshtoken = "";

let apiKey = weatherapp.apikey;

let user = {
  id: "",
  username: ""
}

const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.set('views', './views/pages');
app.set('view engine', 'ejs');



const alreadyLogged = (req, res, next) => {
  if(JSON.parse(JSON.stringify(req.cookies)).LoginCookieWA != null){
    res.redirect("/home");
  }
  else{
    next();
  }
}

const alreadyLoggedProfile = (req, res, next) => {
  if(JSON.parse(JSON.stringify(req.cookies)).LoginCookieWA != null){
    next();
  }
  else{
    res.redirect("/");
  }
}

const checkoggi = (req, res, next) =>{
  console.log("username cookie: " + JSON.parse(JSON.stringify(req.cookies)).LoginCookieWA.username);
  db.permessiOggi(JSON.parse(JSON.stringify(req.cookies)).LoginCookieWA.username, (ret)=>{
    if(ret){
      next();
    }
    else{
      res.redirect("/home");
    }
  })
}

const checkcinque = (req, res, next) =>{
  console.log("username cookie: " + JSON.parse(JSON.stringify(req.cookies)).LoginCookieWA.username);
  db.permessiCinque(JSON.parse(JSON.stringify(req.cookies)).LoginCookieWA.username, (ret)=>{
    if(ret){
      next();
    }
    else{
      res.redirect("/home");
    }
  })
}


function getUserInfo(callback){
  const parameters = {}
  const post_data = querystring.stringify(parameters);
  const options = {
    url: "http://127.0.0.1/",
    port: "8080",
    path: "/realms/WeatherForecastAPP/protocol/openid-connect/userinfo",
    method: "GET",
    headers : {
      'Authorization': 'Bearer ' + accesstoken
    }
  }
console.log(options);
  const request = http.request(options, (res) => {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers)); 
    res.setEncoding('utf8'); 
    res.on('data', function (chunk) {
    console.log('BODY: ' + chunk); 
    console.log("qui"+JSON.parse(chunk).sub+JSON.parse(chunk).preferred_username);
    db.isInDB(JSON.parse(chunk).sub, JSON.parse(chunk).preferred_username, (response)=>{
      if(response){
        console.log("è nel db callback");
      }
      else{
        db.createUser(JSON.parse(chunk).sub, JSON.parse(chunk).preferred_username);
       console.log("isInDB ritornato false");
      }
      return callback(true, JSON.parse(chunk).sub, JSON.parse(chunk).preferred_username);
    });    
  });
});

  request.write(post_data);
  request.end();
  console.log("invio GET dopo la POST");


}


//routes

app.get('/', function(req, res) {
   // parsa il cookie e se è loggato allora manda alla sua pagina progilo
  res.render("home");
  /*res.send("<a href='http://localhost:8080/realms/WeatherForecastAPP/protocol/openid-connect/auth?response_type="+ responseType +"&client_id="+ clientID +"&state="+ state 
    +"&redirect_uri="+ callbackURL +"'>login</a>");*/
    //oauth(req,res);
    //callB(req,res);
});

//app.get
app.get("/login", (req,res) => {
  res.redirect("http://localhost:8080/realms/WeatherForecastAPP/protocol/openid-connect/auth?response_type="+ responseType +"&client_id="+ clientID +"&state="+ state 
  +"&redirect_uri="+ callbackURL);
  
})
app.get('/oauth/redirect', alreadyLogged, (req, resP) => {
  //console.log("la risposta e: " + JSON.stringify(req));
  
  const session = req.query.session_state;
  console.log("session state " + session);
  req.query.state;
  console.log("il code è: "+ req.query.code);
  //POST  con client_id, client_secet, grant_type = authorization_code, code, session_state  => return access token in JSON?

  //POST parameters
  const parameters = {
    client_id: clientID,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code: req.query.code,
    redirect_uri: callbackURL
    //session_state: req.params.session_state
  }
  const post_data = querystring.stringify(parameters);
  const options = {
    url: "http://127.0.0.1/",
    port: "8080",
    path: "/realms/WeatherForecastAPP/protocol/openid-connect/token",
    method: "POST",
    body: JSON.stringify(post_data),
    headers : {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
console.log(options);
  const request = http.request(options, (res) => {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
    var resPOST = JSON.parse(chunk);
    if(session == resPOST.session_state && resPOST.expires_in > 0 && resPOST.refresh_expires_in > 0 && resPOST.token_type == "Bearer" && resPOST.scope == "profile email"){
      accesstoken = resPOST.access_token;
      refreshtoken = resPOST.refresh_token;
      //resPOST.not-before-policy;
      console.log("POST response arrivata");
      getUserInfo((finishied, id, username) => {
        if(finishied){
          user.id = id;
          user.username = username;
          //user.refresh_token = refreshtoken;
          console.log("refreshtoken " + refreshtoken)
          resP.cookie("LoginCookieWA", user, {httpOnly: true});
          console.log('cookie created successfully');
          resP.redirect("/home");
      }});
    }
      
    else{
      console.log("sessione scaduta");
      resP.redirect("/");
      //res.send("http://localhost:8081/");
  }
  });
  });

  request.write(post_data);
  request.end();
  //get userinfo     Autorization: Bearer  accesstoken    https://www.youtube.com/watch?v=0b0D5ZCFKnc
  
})

app.get('/home', alreadyLoggedProfile, function(req, res) {
  //res.send(JSON.stringify(req.cookies));
  res.render("portale");
});

app.get('/oggi', alreadyLoggedProfile, checkoggi, function(req, res) {
  console.log(req.query.citta); //"https://api.openweathermap.org/data/2.5/weather?q=" + req.query.citta + "&appid=" + apiKey
  var url = "https://api.openweathermap.org/data/2.5/weather?q=" + req.query.citta + "&appid=" + apiKey
  
  
  
  
  if(req.query.citta == undefined){
    res.render("oggi", {citta: "Bergamo", temperatura: "10", meteo: "Sole",
      umidita: "1", vento: "6", icon: "03n"})
    res.end();
    }
  else{
      Request(url, (error, response, body) =>{
        if(response.statusCode == 200){
          var data = JSON.parse(body);
          console.log("  " + JSON.stringify(data.weather[0].icon));
          
          res.render("oggi", {citta: req.query.citta, temperatura: (data.main.temp -272.15).toFixed(2) , meteo: data.weather[0].main,
      umidita: data.main.humidity, vento: data.wind.speed, icon: data.weather[0].icon});
      res.end();
        }
        
      })
      
    }
});


app.get("/cinque", alreadyLoggedProfile, checkcinque,  function(req, res) {
  console.log(req.query.citta);
  var url = "https://api.openweathermap.org/data/2.5/forecast?q=" + req.query.citta + "&appid=" + apiKey;

  if(req.query.citta != undefined){
    Request(url, (error, response, body) =>{
      if(response.statusCode == 200){
        var data = JSON.parse(body);
        res.render("cinque", 
        {
          citta: req.query.citta, temperatura: (data.list[0].main.temp -272.15).toFixed(2) , meteo: data.list[0].weather[0].main,
          umidita: data.list[0].main.humidity, vento: data.list[0].wind.speed, icon: data.list[0].weather[0].icon, 
          citta1: req.query.citta, temperatura1: (data.list[8].main.temp -272.15).toFixed(2)  , meteo1: data.list[8].weather[0].main,
          umidita1: data.list[8].main.humidity, vento1: data.list[8].wind.speed, icon1: data.list[8].weather[0].icon,
          citta2: req.query.citta, temperatura2: (data.list[16].main.temp -272.15).toFixed(2) , meteo2: data.list[16].weather[0].main,
          umidita2: data.list[16].main.humidity, vento2: data.list[16].wind.speed, icon2: data.list[16].weather[0].icon,
          citta3: req.query.citta, temperatura3: (data.list[24].main.temp -272.15).toFixed(2) , meteo3: data.list[24].weather[0].main,
          umidita3: data.list[24].main.humidity, vento3: data.list[24].wind.speed, icon3: data.list[24].weather[0].icon,
          citta4: req.query.citta, temperatura4: (data.list[32].main.temp -272.15).toFixed(2) , meteo4: data.list[32].weather[0].main,
          umidita4: data.list[32].main.humidity, vento4: data.list[32].wind.speed, icon4: data.list[32].weather[0].icon
        })
        res.end();
      }
    })
  }
  else{
    res.render("cinque", {citta: "Bergamo", temperatura: "Bergamo" , meteo: "Bergamo",
    umidita: "Bergamo", vento: "Bergamo", icon: "01n", 
    citta1: "Bergamo", temperatura1: "Bergamo" , meteo1: "Sun",
    umidita1: "Bergamo", vento1: "Bergamo", icon1: "01n",
    citta2: "Bergamo", temperatura2: "Bergamo", meteo2: "Sun",
    umidita2: "Bergamo", vento2: "Bergamo", icon2: "01n",
    citta3: "Bergamo", temperatura3: "Bergamo", meteo3: "Sun",
    umidita3: "Bergamo", vento3: "Bergamo", icon3: "01n",
    citta4: "Bergamo", temperatura4: "Bergamo", meteo4: "Sun",
    umidita4: "Bergamo", vento4: "Bergamo", icon4: "01n"});
    res.end();
          
  /*        res.render("oggi", {citta: req.query.citta, temperatura: data.main.temp -272.15 , meteo: data.weather[0].main,
      umidita: data.main.humidity, vento: data.wind.speed, icon: data.weather[0].icon});
      res.end(); */
        }



});


app.get('/logout', (req, res) => {
 /* refreshtoken = req.cookies.LoginCookieWA.refreshtoken;
  var req = http.request(logout, (error, response)=>{
   // console.log("status " + response.statusCode + " " + JSON.stringify(response.headers));

    res.clearCookie("LoginCookieWA");
    res.redirect("/");
  })
    //delete cookie session;
 // req.write();*/
 res.clearCookie("LoginCookieWA");
 res.redirect("http://localhost:8080/realms/WeatherForecastAPP/protocol/openid-connect/logout?redirect_uri=http://localhost:8081/");
});

const isAdmin = (req, res, next)=>{
  if(req.cookies.LoginCookieWA.username == "admin"){
    console.log("buon giorno admin");
    next();
  }
  else{
    res.redirect("/404");
  }
}

app.get('/admin', isAdmin, (req,res) =>{
  JSON.parse(JSON.stringify(req.cookies));
  db.users(result => {
    var users = [], oggi = [], cinque = [], i;
    for(i = 0; i < result.length; i++){
      users[i] = result[i].username;
      oggi[i] = result[i].oggi;
      cinque[i] = result[i].cinque;
    }
    console.log(result);
    //res.send("sei nella pagina admin " + JSON.stringify(req.cookies.LoginCookieWA.username));
    res.render('admin', {users: users, oggi: oggi, cinque: cinque})
  });
  
  //res.render('admin', {users: , oggi: , cinque: })
})

app.post('/admin', isAdmin, ( req, res) =>{
  var permesso = JSON.stringify({permessi: req.body});
  console.log(' permesso' + permesso);
  var json = JSON.parse(permesso);
  db.aggiornaPermesso(req.query.user, permesso, ()=>{
    res.redirect("/admin");
  });
  console.log("user " + req.query.user);
  console.log("body " + req.body);
  console.log("params " + JSON.stringify(req.params));
  
});



//Iterate users data from cookie
app.get('*', (req, res)=>{
  res.status("404");
  res.send("404 pagina non trovata");
  });



var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(httpPort, err => {
  console.log('http server on port ' + httpPort);
});
httpsServer.listen(httpsPort, err => {
  console.log('https server on port ' + httpsPort);
});
