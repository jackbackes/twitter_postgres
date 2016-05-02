'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');


module.exports = function makeRouterWithSockets (io, pg) {






  // a reusable function
  function respondWithAllTweets (req, res, next){
    pg.query('SELECT users.name AS name, users.pictureUrl, tweets.id AS id, tweets.content AS text FROM tweets INNER JOIN users ON users.id = tweets.UserId', function(err, result){
      // var allTheTweets = tUtils.remapTweets(result);
      var allTheTweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: allTheTweets,
        showForm: true
      });
    })
    // console.error(allTheTweets);
  }


  //recreating tweetBank.list as a query:

  var queries = {
    tweetList:
    pg.query('SELECT users.name AS name, users.pictureUrl, tweets.id AS id, tweets.content AS text FROM tweets INNER JOIN users ON users.id = tweets.UserId', function(err, result){
      // console.log(result.rows[7]);
      // console.log(result.rows[9]);
      var tweets = result.rows;
      // var tweets = tUtils.remapTweets(result);
      // console.log(tweets[7]);
      // console.log(tweets[9]);
      return tweets;
    })
  }
var tUtils = {
  remapTweets(result){
    var tweets = result.rows.map(function(curr, i, arr){
      var newObj = {
        id: curr.id,
        text: curr.content,
        name: curr.name,
        pictureurl: curr.pictureurl
      }
      return newObj;
    });
    return tweets;
  },
  list() {return tUtils.remapTweets(queries.tweetList._result)}
}



  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    //var tweetsForName = tweetBank.find({ name: req.params.username }); //****** 2, 3
    pg.query('SELECT users.name AS name, users.pictureUrl, tweets.id AS id, tweets.content AS text FROM tweets INNER JOIN users ON users.id = tweets.UserId WHERE users.name LIKE $1',[req.params.username], function(err, result){
      // var tweetsForName = tUtils.remapTweets(result);
      var tweetsForName = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweetsForName,
        showForm: true,
        username: req.params.username
      });
    })

  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    pg.query('SELECT users.name AS name, users.pictureUrl, tweets.id AS id, tweets.content AS text FROM tweets INNER JOIN users ON users.id = tweets.UserId WHERE tweets.id = $1',[req.params.id], function(err, result){
      var tweetsWithThatId = result.rows;
    // var tweetsWithThatId = tUtils.remapTweets(result); //****** 4
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsWithThatId // an array of only one element ;-
    });
  });
  });

  // check if user exists
  router.post('/tweets', function(req, res, next){
    pg.query('SELECT id FROM users WHERE name LIKE $1', [req.body.name], function(err, nameResult){
      if(!nameResult.rows){
        pg.query('INSERT INTO users (name) VALUES ($1)',[req.body.name], (err, result) => {
          pg.query('SELECT * FROM users WHERE name LIKE $1', [req.body.name], (err2, result2) => {
            console.log('inserted',result2.rows)
            next();
          })
        })
      } else {
        console.log('user exists!',nameResult.rows);
        next();
      }
    })
  })
  // create a new tweet
  router.post('/tweets', function(req, res, next){
    // console.log(req.body.text);
    pg.query('SELECT id FROM users WHERE name LIKE $1', [req.body.name], (err1, result1) => {
      console.log(result1.rows[0]);
      pg.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)',[result1.rows[0].id, req.body.text], function(err, result2){
        console.log(err);
        console.log(result1.rows);
        console.log(result2.rows);
        pg.query('SELECT * FROM tweets', function(err, tweets){
          var lastTweetId = tweets.rows[tweets.rows.length-1].id;
          var newTweet = {
            name: req.body.name,
            text: req.body.text,
            id: lastTweetId
          }
            // var newTweet = result.rows[0];
            // console.error(newTweet);
            // var newTweet = tweetBank.add(req.body.name, req.body.text); //****** 4, 5
            io.sockets.emit('new_tweet', newTweet);
            res.redirect('/');
          })
        })
      })
    })

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
