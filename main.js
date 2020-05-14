"use strict";

const numberOfDays = 5;

const scaleBounds =
  { startHour: 5
  , endHour: 20
  };

const defaultInitialState =
  { periods:
      [ {day: 0, start: 8*60, end: 16*60 + 30}
      , {day: 1, start: 8*60, end: 16*60 + 30}
      , {day: 2, start: 8*60, end: 16*60 + 30}
      , {day: 3, start: 8*60, end: 16*60 + 30}
      , {day: 4, start: 8*60, end: 16*60 + 30}
      ]
  };


let state = null;

function onLoad() {
  console.log("onLoad");

  state = getInitialState();

  setupUI();
}

function getInitialState() {
  // TODO: load state from a cookie
  return defaultInitialState;
}


function setupUI() {
  function get(className) {
    return document.getElementsByClassName(className)[0];
  }
  const week = get("week");

  console.log("days?");
  for (let i=0; i<numberOfDays; i++) {
    console.log("day...");
    week.appendChild(createDayElement());
  }
}

function createDayElement() {
  const day = document.createElement("div");
  day.className = "day";
  const scale = document.createElement("div");
  scale.className = "timescale";
  for (let h = scaleBounds.startHour; h < scaleBounds.endHour; h++) {
    scale.appendChild(createHourElement(h));
  }
  day.appendChild(scale);
  return day;
}

function createHourElement(hour) {
  const e = document.createElement("div");
  e.className = "hour_in_scale";
  e.innerHTML = timeString(hour*60);
  return e;
}

function timeString(minutes) {
  const hours = Math.floor(minutes/60);
  const leftOverMinutes = Math.round(minutes - hours*60);
  return ("00" + hours).slice(-2) + ":" + ("00" + leftOverMinutes).slice(-2);
}
