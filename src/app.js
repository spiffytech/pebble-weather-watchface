var UI = require("ui");
var Vector2 = require("vector2");
var ajax = require("ajax");
var _ = require("lodash");

var BACKGROUND_COLOR = "white";
var TEXT_COLOR = "black";

// Clock
var wind = new UI.Window({fullscreen: true});
//var wind = new UI.Window({backgroundColor: BACKGROUND_COLOR});

wind.add(new UI.Rect({
  backgroundColor: BACKGROUND_COLOR,
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
}));

wind.add(new UI.TimeText({
  color: TEXT_COLOR,
  position: new Vector2(0, 0),
  size: new Vector2(144, 50),
  font: "bitham-42-light",
  text: "%H:%M"
}));

// Day of week
wind.add(new UI.TimeText({
  color: TEXT_COLOR,
  position: new Vector2(0, 51),
  size: new Vector2(144, 20),
  font: "gothic-14",
  text: "%A %d"
}));
wind.show();

var temperature_element = new UI.Text({
  color: TEXT_COLOR,
  position: new Vector2(0, 71),
  size: new Vector2(144, 20),
  text: "..."
});
wind.add(temperature_element);

var last_update_element = new UI.Text({
  color: TEXT_COLOR,
  position: new Vector2(0, 91),
  size: new Vector2(100, 20),
  text: "..."
});
wind.add(last_update_element);

// Scan hourly forecasts for the one most recent in history
function find_closest_forecast(curr_time, forecasts) {
  return _(forecasts).filter(function(f) {return f.time <= Math.floor(Date.now() / 1000);}).head();
}

// Get forecast from forecast.io
function retrieve_temperature(cb) {
  ajax(
    {
      url: "https://api.forecast.io/forecast//35.9333,-79.0333",
      type: "json"
    },
    function(data) {
      cb(data);
    },
    function(err) { console.log(err); }
  );
}

// Display the updated temperature
function update_temperature() {
  retrieve_temperature(function(data) {
    var closest = find_closest_forecast(Math.floor(Date.now() / 1000), data.hourly.data);
    temperature_element.text(Math.round(closest.temperature) + " F");
    
    var d = new Date();
    last_update_element.text(d.getHours() + ":" + d.getMinutes());
  });
}

// Get temperature, and schedule future updates
update_temperature();
setInterval(update_temperature, 1000 * 60 * 120);