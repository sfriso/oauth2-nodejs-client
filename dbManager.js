const { json } = require('body-parser');
const db = require('mysql');

const executeQuery = require("./db/sqlscript.js");




exports.isInDB =  function isInDB(id,username, callback){
    console.log("isInDB() richiamato"); 
    console.log("id: " + id + ", username: " + username);
    executeQuery("select * FROM users WHERE id ='" + id + "' AND username = '"+ username +"'", function(error, results){
        if(error) {
            console.log("error isInDB => " + error);
            return callback(false);
        }
        else{
            console.log("risultato: " + results);
            if(results == ""){
                console.log("risultato vuoto");
                return callback(false);
            }
            if(JSON.parse(JSON.stringify(results[0])).username == username){
                console.log("è nel db interno");
                console.log("ritorno true");
                return callback(true);
            }
            else{
                console.log("non è nel db! " + results[0]);
                return callback(false);
            }
        }
    });
}

exports.aggiornaPermesso = function aggiornaPermesso(user, permesso ,callback){
    var oggi = false, cinque = false;
    var json = JSON.parse(permesso).permessi;
    console.log("permessi " + json.oggi + json.cinque);
    if(json.oggi == "oggi"){
        oggi =true;
        console.log("oggi ha il permesso");
    }
    if(json.cinque == "cinque"){
        cinque =true;
        console.log("cinque ha il permesso");
    }
    executeQuery("UPDATE `users` SET oggi="+ oggi +",cinque=" + cinque + " WHERE username='" + user + "'", (err,res)=>{
        return callback(true);
    });
}

exports.permessiOggi = function permessiOggi(user, callback){
    executeQuery("SELECT oggi FROM users WHERE username='" + user + "'", (err,res) =>{
        console.log("risosta db " + res[0]["oggi"]);
        if(res[0]["oggi"] == 1){
            console.log("oggi == 1");
            return callback(true)
        }else{
            console.log(JSON.parse(JSON.stringify(res)).oggi + "<= if");
            console.log("oggi == 0");
            return callback(false)
        }
    })
}

exports.permessiCinque = function permessiOggi(user, callback){
    executeQuery("SELECT cinque FROM users WHERE username='" + user + "'", (err,res) =>{
        console.log("risosta db " + JSON.stringify(res));
        if(res[0]["cinque"] == 1){
            console.log("cinque == 1");
            return callback(true)
        }else{
            console.log("cinque == 0");
            return callback(false)
        }
    })
}

exports.createUser = function createUser(id, username){
    
    executeQuery("INSERT INTO users (id, username, oggi, cinque) VALUES ('"+ id +"','"+ username +"',"+ false +","+ false +")", (error,results)=>
    {
        if(error) console.log("errore createUser(): "+ error);
        else {
            console.log("creazione andata a buon fine: " + results);
        }
    });
}

exports.users = function users(callback){
    executeQuery("SELECT * FROM users where username <> 'admin'", (error,results) =>{
        if(error) console.log("errore createUser(): "+ error);
        else {
            console.log(JSON.stringify(results[0]));
            callback(results);
        }
    })
}

    