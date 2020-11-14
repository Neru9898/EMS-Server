const { subHours, formatISO, isSameHour, startOfHour, parseISO, getHours } = require('date-fns');
const express = require('express');
const _ = require('lodash');
const murbAPI = express.Router();
const { murbPower } = require('../models/murb');


murbAPI.get('/', (req, res) => {
  const {startDate, endDate} = req.query;

  murbPower.find({
    TimeStamp: {
      $gte: startDate,
      $lte: endDate
    }
  }, (err, murbs) => {
    if (err) return console.error(err);

    if (murbs.length > 100) {
      res.status(404).send({error: "Requested more than a 100 points"});
    } else {
      res.send(murbs);
    }
  });
});

function avgPowerFromData(data) {
  return data.map(data => data.Power).reduce((sum, n) => sum + n)
}

murbAPI.get('/pastDay', (req, res) => {
  murbPower.find({
    TimeStamp: {
      $gte: formatISO(subHours(new Date(), 24)),
      $lte: formatISO(new Date())
    }
  }, (err, murbs) => {

    const murbsAggregatedHours = murbs.map((murb) => ({
      Power: murb.Power,
      TimeStamp: startOfHour(murb.TimeStamp)
    }));

    let aggregatedData = [];
    let aggregatingHour = murbsAggregatedHours[0];
    let aggregatingPower = [];

    for (const murb of murbsAggregatedHours) {
      if (isSameHour(murb.TimeStamp, aggregatingHour.TimeStamp)) {
        aggregatingPower.push(murb.Power);
      } else {
        aggregatedData.push({
          Power: aggregatingPower.reduce((sum, n) => sum + n)/aggregatingPower.length,
          TimeStamp: aggregatingHour.TimeStamp
        });
        aggregatingHour = murb;
        aggregatingPower = [];
      }
    }

    let peakArray = aggregatedData.slice(0,4);
    for (let i=0; i < aggregatedData.length - 4; i++) {
      const checkArray = aggregatedData.slice(i, i + 4)
      if (avgPowerFromData(peakArray) <= avgPowerFromData(checkArray)) {
        peakArray = checkArray;
      } 
    }

    const peakHours = `${getHours(peakArray[0].TimeStamp)} - ${getHours(_.last(peakArray).TimeStamp)}`

    let offPeakArray = aggregatedData.slice(0,4);
    for (let i=0; i < aggregatedData.length - 4; i++) {
      const checkArray = aggregatedData.slice(i, i + 4)
      if (avgPowerFromData(offPeakArray) >= avgPowerFromData(checkArray)) {
        offPeakArray = checkArray;
      } 
    }

    const offPeakHours = `${getHours(offPeakArray[0].TimeStamp)} - ${getHours(_.last(offPeakArray).TimeStamp)}`

    if (err || !aggregatedData) {
      res.sendStatus(500);
    } else {
      res.send({
        peakHours,
        offPeakHours,
        aggregatedData
      });
    }
  });
});

murbAPI.post('/oldData', (req, res) => {
  murbPower.create(req.body, (err) => {
    if (err) {
      res.sendStatus(400);
      console.log(err);
    }
    res.sendStatus(200);
  });
});

murbAPI.post('/newData', (req, res) => {
  murbPower.create(req.body, (err) => {
    if (err) {
      res.sendStatus(400);
      console.log(err);
    }
    res.sendStatus(200);
  });
});

module.exports = murbAPI;