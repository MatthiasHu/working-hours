"use strict";

const numberOfDays = 5;

const scaleBounds =
  { startHour: 5
  , endHour: 20
  };

const breakTimesPrescription =
  [ {from: 6 * 60, minutes: 30}
  , {from: 8 * 60, minutes: 45}
  ];

const minimalWorkDuration = 30;

const defaultInitialState =
  { periods:
      [ {start: 8*60, end: 16*60 + 30}
      , {start: 8*60, end: 16*60 + 30}
      , {start: 8*60, end: 16*60 + 30}
      , {start: 8*60, end: 16*60 + 30}
      , {start: 8*60, end: 16*60 + 30}
      ]
  };

const localStorageItemName = "working_hours_state";


let ui =
  { week: null
  , days: []
  , daySummaries: []
  , daysSummary: null
  , weekSummary: null
  };

let state = null;


function onLoad() {
  state = getInitialState();

  setupUI();

  realizeState();
}

function getInitialState() {
  const retrieved = localStorage.getItem(localStorageItemName);
  if (retrieved != null) {
    return JSON.parse(retrieved);
  }
  else {
    const periods = [];
    defaultInitialState.periods.forEach(p => {
      periods.push({start: p.start, end: p.end});
    });
    return {periods: periods};
  }
}

function setupUI() {
  function get(id) {
    return document.getElementById(id);
  }

  ui.week = get("week");
  ui.daysSummary = get("days_summary");
  ui.weekSummary = get("week_summary");

  ui.week.appendChild(createDiv("vertical_line"));
//  ui.daysSummary.appendChild(createDiv("vertical_line"));

  for (let d = 0; d < numberOfDays; d++) {
    const p = state.periods[d];
    const minD = minimalWorkDuration;
    const minS = scaleBounds.startHour * 60;
    const maxE = scaleBounds.endHour * 60;
    const day = createDayDiv(
        (s) => {
          p.start = Math.max(minS, Math.min(s, p.end - minD));
          realizeState();
        }
      , (e) => {
          p.end = Math.min(maxE, Math.max(e, p.start + minD));
          realizeState();
        }
    );
    ui.week.appendChild(day);
    ui.week.appendChild(createDiv("vertical_line"));
    ui.days.push(day);

    const summary = createDaySummaryDiv()
    ui.daysSummary.appendChild(summary);
//    ui.daysSummary.appendChild(createDiv("vertical_line"));
    ui.daySummaries.push(summary);
  }
}

function createDiv(className) {
  const div = document.createElement("div");
  div.className = className;
  return div;
}

function createDayDiv(updatePeriodStart, updatePeriodEnd) {
  const day = createDiv("day");

  const scale = createDiv("timescale");
  for (let h = scaleBounds.startHour; h < scaleBounds.endHour; h++) {
    scale.appendChild(createHourElement(h));
  }
  day.appendChild(scale);

  const period = createDiv("working_period");
  const top_handle = createDiv("top_handle handle flex_centering");
  setHandleEventHandlers(
      top_handle
    , () => period.getBoundingClientRect().top
    , updatePeriodStart
  );
  period.appendChild(top_handle);
  period.top_handle = top_handle;
  const bottom_handle = createDiv("bottom_handle handle flex_centering");
  setHandleEventHandlers(
      bottom_handle
    , () => period.getBoundingClientRect().bottom
    , updatePeriodEnd
  );
  period.appendChild(bottom_handle);
  period.bottom_handle = bottom_handle;
  day.appendChild(period);
  day.workingPeriod = period;

  const breakElement = createDiv("break flex_centering");
  day.appendChild(breakElement);
  day.breakElement = breakElement;

  return day;
}

function createDaySummaryDiv() {
  const summary = createDiv("single_day_summary");

  const total = createDiv("total_duration_display flex_centering");
  summary.appendChild(total);
  summary.totalDurationDisplay = total;

  const breakD = createDiv("break_duration_display flex_centering");
  summary.appendChild(breakD);
  summary.breakDurationDisplay = breakD;

  const net = createDiv("net_duration_display flex_centering");
  summary.appendChild(net);
  summary.netDurationDisplay = net;

  return summary;
}

function setHandleEventHandlers(handleElement, getEdgeY, setTime) {
  const onStart = (e) => {
    e.preventDefault();

    let offset = getEdgeY() - e.clientY;

    const onMove = (e) => {
      e.preventDefault();

      const desiredEdgeY = e.clientY + offset;
      const weekClientRect = ui.week.getBoundingClientRect();
      const desiredTime =
        (scaleBounds.startHour * 60)
        + (   (desiredEdgeY - weekClientRect.top)
            / (weekClientRect.bottom - weekClientRect.top)
            * (scaleBounds.endHour - scaleBounds.startHour) * 60
          );
      setTime(roundTo(5, desiredTime));
    };

    document.onmousemove = onMove;
    document.ontouchmove = onMove;

    const onStop = (e) => {
      e.preventDefault();

      document.onmousemove = null;
      document.onmouseup = null;
      document.ontouchmove = null;
      document.ontouchstop = null;
      document.ontouchcancel = null;
    };

    document.onmouseup = onStop;
    document.ontouchend = onStop;
    document.ontouchcancel = onStop;

  };
  handleElement.onmousedown = onStart;
  handleElement.ontouchstart = onStart;
}

function roundTo(unit, value) {
  return unit * Math.round(value/unit);
}

function createHourElement(hour) {
  const e = document.createElement("div");
  e.className = "hour_in_scale";
  e.innerHTML = timeString(hour*60);
  return e;
}

function realizeState() {
  const scaleLength = (scaleBounds.endHour - scaleBounds.startHour) * 60;
  const scaleStart = scaleBounds.startHour * 60;
  const percentPerMinute = 100 / scaleLength;

  let netSum = 0;

  for (let d = 0; d < numberOfDays; d++) {
    const start = state.periods[d].start;
    const end = state.periods[d].end;
    const totalDuration = end - start;
    const breakDuration = prescribedBreakDuration(totalDuration);
    const netDuration = totalDuration - breakDuration;
    const breakStart = start + (end - start)/2 - breakDuration/2;

    const period = ui.days[d].workingPeriod;
    const breakElement = ui.days[d].breakElement;
    period.style.top = ((start - scaleStart) * percentPerMinute) + "%";
    period.style.height = ((end - start) * percentPerMinute) + "%";
    period.top_handle.innerHTML = timeString(start);
    period.bottom_handle.innerHTML = timeString(end);
    breakElement.style.top = ((breakStart - scaleStart) * percentPerMinute) + "%";
    breakElement.style.height = (breakDuration * percentPerMinute) + "%";
    breakElement.innerHTML = timeString(breakDuration);
    breakElement.style.display = breakDuration > 0 ? "" : "none";

    const summary = ui.daySummaries[d];
    summary.totalDurationDisplay.innerHTML = timeString(totalDuration);
    summary.breakDurationDisplay.innerHTML = timeString(breakDuration);
    summary.netDurationDisplay.innerHTML   = timeString(netDuration);

    netSum += netDuration;
  }

  ui.weekSummary.innerHTML = timeString(netSum);

  localStorage.setItem(localStorageItemName, JSON.stringify(state));
}

function prescribedBreakDuration(workingPeriodDuration) {
  const duration = workingPeriodDuration;
  const pres = breakTimesPrescription;
  let res = 0;
  for (let i = 0; i < pres.length; i++) {
    res = Math.max(res, Math.min(pres[i].minutes, duration - pres[i].from));
  }
  return res;
}

function timeString(minutes) {
  const hours = Math.floor(minutes/60);
  const leftOverMinutes = Math.round(minutes - hours*60);
  return ("00" + hours).slice(-2) + ":" + ("00" + leftOverMinutes).slice(-2);
}
