var ndd = require('near-dup-detection');
var async = require('async');

var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res, next){
    res.render('index', {title : 'get', txt : ''});
});

app.get('/get', function(req, res, next){

    var query = connection.query('SELECT txt FROM mevix_tst WHERE id='+parseInt(req.query.id), function(err, rows) {
	res.render('item', {txt : rows ? rows[0].txt : ''});
    });
});

app.post('/', function(req, res, next){

    ndd.getShingles(req.body.txt, function(err, arr){
        var tasks = {};
        for(var i in shingles){
		tasks[i] = async.apply(ndd.compareShingles, arr, shingles[i]);
        }
        async.parallel(tasks, function(err, result){
	    
	    var outArr = [];
	    
	    for(var i in result){
		if(result[i] > 0.1){
		    outArr.push({
			id : i,
			weight : result[i]
		    });
		}
	    }
	    
	    outArr.sort(function(a,b){return b.weight - a.weight;})
	    
	    res.render('index', {title : 'post', txt : req.body.txt, result : outArr});
        });
    });    
});


var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'test',
    password : 'xxx',
    database : 'test'
});
connection.connect();

var shingles;

var query = connection.query('SELECT id, txt FROM mevix_tst', function(err, rows) {

    var tasks = {};
    for(var i in rows){
	tasks[rows[i].id] = async.apply(ndd.getShingles, rows[i].txt);
    }
    async.parallel(tasks, function(err, result){
	
	shingles = result;
	
	http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
    });
});
