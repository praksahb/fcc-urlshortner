'use strict';

var express = require('express');
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var shortUrl = require('./models/shortUrl');
const dns = require('dns');
const url = require('url');


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', function(req, res) {
  let postedUrl = req.body.url;
  console.log(postedUrl);
  //check if postedUrl already exists in database
  shortUrl.findOne({ originalUrl: postedUrl }, function(err, data) {
    if(err) { 
      console.log(err);
    }
    if(data) {
      res.json({
        url: data.originalUrl,
        shortUrl: "https://url-sh0rtn3r.glitch.me/api/shorturl/" +  data.shorterUrl
      });
    }
    else {
  
      let urlObj = url.parse(postedUrl);
      console.log("urlObj", urlObj);
      //if urlObj.protocol will not contain http- then urlobj.pathname will be saved-- urlObj.host will be null as well in that case
      let lookupUrl = urlObj.protocol ? urlObj.host : urlObj.pathname;
      console.log("lookupUrL", lookupUrl);
      dns.lookup(lookupUrl, function(err, address, family) {
        console.log("address: %j  family: IPv%s", address, family);
        if(err || !address) {
          console.log(err);
          res.json({ error: "invalid URL" });
        }
        else {
          //create shortUrl 
          var short = Math.floor(Math.random()*10000).toString();

          //create&save url address&short-address to database
          var data = new shortUrl({
              originalUrl: urlObj.href,
              shorterUrl: short
          });
          data.save(function(err) {
            if(err) {
              return res.send("error saving to database");
            }
          });

          //display as json file- the saved url 
          res.json({
            url: data.originalUrl,
            shorterUrl: "https://url-sh0rtn3r.glitch.me/api/shorturl/" +  data.shorterUrl
          });
        }
      });
    }
  });
});

//get request to connect 
app.get("/api/shorturl/:newurl", function(req, res) {
    var newUrl = req.params.newurl;
    
    //search the database for the newurl-shorturl
    shortUrl.findOne({'shorterUrl': newUrl}, function(err, data) {
      if (err) {
        console.log(err);
        res.send("error reading fromdatabase");
      }
      var urlObj = url.parse(data.originalUrl);
      //check if url contains http:// otherwise add it
      var prefix = urlObj.protocol ? '' : 'http://';
      res.redirect(prefix + data.originalUrl);
    });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});