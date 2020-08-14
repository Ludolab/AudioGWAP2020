const express = require('express')
const app = express()
const mongo = require('./lib/mongo')
require('dotenv').config()

// use sass/scss
// var sass = require('node-sass-middleware');
//
//  app.use(
//      sass({
//          src: './public',    // Input SASS files
//          dest: './public', // Output CSS
//          debug: true
//      })
//  );

app.set('view engine', 'pug')
app.use(express.static('public'))
app.use('/upload', express.static('../project/server/upload'))

mongo.dbConnect(err => {
  const datasetRouter = require('./routes/dataset')
  const homeRouter = require('./routes/home')
  const downloadRouter = require('./routes/download')
  app.use('/dataset', datasetRouter)
  app.use('/d', downloadRouter)
  app.use('/', homeRouter)

  app.get('/people', async (req, res) => {
    res.render('people')
  })

  app.get('/future', async (req, res) => {
    res.render('future')
  })
  
  app.get('/', async (req, res) => {
    res.render('home')
  })

  app.use(function (req, res, next) {
    res.status(404).send('404 Error: Page not found')
  })

  app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('An error happened on our end. Sorry!')
  })

  app.listen(5000,() => console.log('listening on port 5000.'))
})