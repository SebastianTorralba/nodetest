const  express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const parser = new Readline();
const socketIO = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketIO.listen(server);
const bodyParser = require('body-parser');
const { Client } = require('pg');
const fs = require('fs');


//configuraciones
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname,'src/views'));
app.use(express.static(path.join(__dirname + '/public')));

app.engine('html',require ('ejs').renderFile);
app.set('view engine','ejs');
app.set('json spaces',2);


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/NuevoUsuario.html');
});


//Inicia el servidor
server.listen(app.get('port'), () => {

    console.log(`Server on port ${app.get('port')}`);
});



const connectionData = {
    user: 'postgres',
    host: 'localhost',
    database: 'prueba',
    password: 'emijuan2308',
    port: 5432,
  }
  const client = new Client(connectionData)



io.on('connection', function(socket){
    console.log('Nueva conexion de socket');  
});
//comunicacion Serial 
const mySerial = new SerialPort('COM8',{
baudRate:9600
});

mySerial.on('open', function(){
console.log('Puerto serial abierto ');
});

mySerial.on('data',function(data){
    //let rfid = toString(data,8);
    console.log(data.toString());
    io.emit('rfid',data.toString());
    });


mySerial.on('err',function(err){
console.log(err.message);
});




//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));



//routes
app.get('/mapa',(req,res)=>{
    res.render('mapa.html');  
});
app.get('/mapaprueba',(req,res)=>{
    res.render('mapaprueba.html');  
});

app.get('/mapaEntrada',(req,res)=>{
    client.connect(function(err){
        var sql="SELECT id_entrada, c.calle  FROM entrada e JOIN cuadras c ON id_calle = id_entrada ORDER BY id_entrada ASC "
        client.query(sql,function(err,result){
        res.render('mapaEntrada.html',{
        calle: result.rows
            });
        });
    });
});

app.get('/mapaSalida',(req,res)=>{
    res.render('mapaSalida.html');  
});
app.get('/NuevoUsuario',(req,res)=>{
    res.render('NuevoUsuario.html');
});

//Funciones de Lectura
app.get('/usuarios',(req,res,next)=>{
    
  client.connect(function(err){
    var sql="SELECT * FROM usuarios ORDER BY id ASC"
    client.query(sql,function(err,result){
    res.render('usuarios.html',{
    usuario: result.rows
        });
    });
});
});  
app.get('/NuevoVehiculo',(req,res)=>{
    res.render('NuevoUsuario.html');
});

//Funciones de Edicion y Actualizacion

app.get('/Actualizar/:id',(req,res)=>{
    req.params.id;
    client.connect(function(err) {
        console.log("connected");
        var sql = "SELECT * FROM usuarios WHERE id = ('"+req.params.id+"') ";
        client.query(sql, function(err, result)  {               
                res.render('EditarUsuario.html',{
                    usuario: result.rows[0]
                });
        });  
    }); 

});
app.post('/Actualizar/:id',(req,res)=>{
    
    var param = [
        req.body.uid,
        req.body.nombre,
        req.body.apellido,
        req.body.patente
    ]
    client.connect(function(err) {
        console.log("connected");
        var sql = "UPDATE usuarios SET uid=$1, nombre=$2, apellido=$3, patente=$4  WHERE id = ('"+req.params.id+"')";
        client.query(sql,param, function(err, rows) {
            if (rows != 0) {
                res.redirect('/usuarios');
            } else {
                console.log("Error al editar el usuario");
            } 
        });  
    }); 

});

//Funcion de Baja ("DELETE")
app.get('/BajaUsuario/:id',(req,res)=>{
    
    req.params.id;
    client.connect(function(err) {
        console.log("connected");
        var sql = "DELETE FROM usuarios WHERE id = ('"+req.params.id+"') ";
        client.query(sql, function(err, rows)  {
            console.log("Usuario Borrado correctamente");
        },(err,rows) => {
            res.redirect('/usuarios');
        });  
    }); 
    
});

//Funciones de Registro
app.post('/Registro', function (req, res,next) {

    let name = req.body.uid + ' ' + req.body.nombre + ' ' + req.body.apellido + ' ' + req.body.patente + ' ';
    client.connect(function(err) {
        console.log("connected");
        var sql = "INSERT INTO usuarios (uid, nombre,apellido , patente)VALUES('"+req.body.uid+"','"+req.body.nombre+"', '"+req.body.apellido+"', '"+req.body.patente+"')";
        client.query(sql, function(err, result)  {
            console.log("Register information saved.");
        },(err,result) => {
            res.redirect('/usuarios');
        });  
    });   

});

app.post('/Entrada', function (req, res,next) {
  
    req.params.id_entrada;
    let name = req.body.nombre + ' ' +req.body.apellido+' '+ req.body.patente + ' '+req.body.horario_entrada+' '+req.body.uid+' '+req.body.calle+' ';
    client.connect(function(err) {
        console.log("connected");
        var sql = "INSERT INTO entrada (nombre,apellido,patente,horario_entrada,uid,calle)VALUES('"+req.body.nombre+"','"+req.body.apellido+"','"+req.body.patente+"','"+req.body.horario_entrada+"','"+req.body.uid+"','"+req.body.calle+"')";
        client.query(sql, function(err, result)  {
            console.log(err);
        });  
    });   
});

app.post('/Salida', function (req, res,next) {

    let name = req.body.nombre + ' ' +req.body.apellido+' '+ req.body.patente + ' '+req.body.horario_salida+' '+req.body.calle+' '+req.body.uid+' ';
    client.connect(function(err) {
        console.log("connected");
        var sql = "INSERT INTO salida (nombre,apellido,patente,horario_salida,calle,uid)VALUES('"+req.body.nombre+"','"+req.body.apellido+"','"+req.body.patente+"','"+req.body.horario_salida+"','"+req.body.calle+"','"+req.body.uid+"')";
        client.query(sql, function(err, result)  {
            console.log(err);
            console.log("Register information saved.");
        },(err,result) => {
            console.log(err);
            res.redirect('/mapa');
        });  
    });   

});

app.post('/Cuadras', function (req, res,next) {

    let name = req.body.lat + ' ' +req.body.lng+' '+ req.body.calle + ' '+req.body.lugares+' '+req.body.ocupado+' ';
    client.connect(function(err) {
        console.log("connected");
        var sql = "INSERT INTO cuadras (lat,lng,calle,lugares,ocupado)VALUES('"+req.body.lat+"','"+req.body.lng+"','"+req.body.calle+"','"+req.body.lugares+"','"+req.body.ocupado+"')";
        client.query(sql, function(err, result)  {
            console.log(err);
            console.log("Register information saved.");
        },(err,result) => {
            console.log(err);
            res.redirect('/mapa');
        });  
    });   

});


 























