//dataset.js - Dataset page route module

const express = require('express')
const router = express.Router()
const mongo = require('../lib/mongo')
const db = mongo.getDb()
const sound_categories = db.collection('sound_categories')
const wfi = require('wav-file-info')
const EventEmitter = require('events')
const wavDone = new EventEmitter()

const categoryList = ["Kitchen", "Bathroom", "Living/Bedroom", "Garage", "Ambience", "Concerning"]

/** Route for search results
 *  Searches database from the query operators in URL
 */
router.get('/search/', async (req, res) => {
  const { q } = req.query
  let results = []
  if (q && q.length > 0) {
      results = await getResults(q)
  }
  if (q) {
      console.log('Query: ' + q)
  }

  /*somewhat hacky setup to make sure all wav files done analyzing
    if you have a better idea, feel free to modify
    gets count of # of sounds first, then checks count to decide when to render*/
  let numFound = 0
  results.forEach(category => {
    numFound += category.sounds.length
  });
  let totalSize = 0

  if (numFound == 0) {
    res.render('search', {
      results: results, 
      query: q, 
      count: numFound,
      totalSize: '0 B'
    })
  } else {
    let analysisCount = 0
    for (const category of results) {
      let len = category.sounds.length
      //gets the size of each audio file
      for (let i = 0; i < len; i++) {
        let sound = category.sounds[i]
        wfi.infoByFilename('../project/server' + sound, (err, info) => {
          let obj
          if (err) {
            console.log(err)
            obj = {
              path: sound,
              fileSize: 'Error',
              bitDepth: 'Error',
              sampleRate: 'Error'
            }
          } else {
            let size = info.stats.size
            totalSize += size
            obj = {
              path: sound,
              fileSize: convertSize(size),
              bitDepth: info.header.bits_per_sample.toString() + ' bit',
              sampleRate: info.header.sample_rate.toString() + ' Hz'
            }
          }
          category.sounds[i] = obj
          analysisCount++
          if (analysisCount == numFound) {
            totalSize = convertSize(totalSize)
            console.log('Rendering page!')
            res.render('search', {
              results: results, 
              query: q, 
              count: numFound,
              totalSize: totalSize
            })
          }
        })
      }
    }
  }
})

/** Route for general dataset landing page
 *  Populates list of categories via hardcoded array (for now), searches
 *  db to get list of subcategories for each parent category
 */
router.get('/', async (req, res) => {
  let ontology = {}
  for(const category of categoryList) {
    ontology[category] = await getSubCategories(category)
  }
  //console.log(ontology)
  res.render('dataset', {ontology: ontology})
})

//Searches sound_categories database for categories that match
async function getResults(query) {
  let cursor = await sound_categories.find({
    sub: {$regex: query, $options: 'i'}
  })
  return cursor.sort({
    sub: 1
  }).toArray()
}

//Searches sound_categories database for subcategories with a desired parent category
async function getSubCategories(category) {
  let cursor = await sound_categories.find({'parent': category})
  return cursor.sort({'sub': 1}).toArray()
}

function convertSize(size) {
  if (size < 1000) {
    return size.toString() + " B"
  } else if (size < 1000000) {
    size = size / 1000
    return size.toFixed(1) + " KB"
  } else {
    size = size / 1000000
    return size.toFixed(1) + " MB"
  }
}

module.exports = router