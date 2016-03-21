var UI = require("ui");
var Vector2 = require("vector2");
var ajax = require("ajax");
var _ = require("lodash");

var BACKGROUND_COLOR = "white";
var TEXT_COLOR = "black";

var FORECAST_API_KEY = "";
var LOCATION = "35.9333,-79.0333";

function get_and_cache(key, duration, fn, cb) {
  function update_value() {
    console.log("Refreshing " + key);
    fn(function(value) {
      var to_store = {
        timestamp: Date.now(),
        value: value
      };
      localStorage.setItem(key, JSON.stringify(to_store));
      
      cb(value);
    });
  }
  
  var storedJSON = localStorage.getItem(key);
  if(storedJSON === null) {
    console.log("Value not cached");
    update_value();
  } else {
    var stored = JSON.parse(storedJSON);
  
    // Set if unset / expired
    if(
      !stored.hasOwnProperty("timestamp") ||
      stored.timestamp + duration <= Date.now()
    ) {
      console.log("Invalid/expired cached value");
      update_value();
    } else {
      console.log("Reading cached value for " + key);
      cb(stored.value);
    }
  }
}

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
      url: "https://api.forecast.io/forecast/" + FORECAST_API_KEY + "/" + LOCATION,
      type: "json"
    },
    function(data) {
      cb(data);
    },
    function(err) { console.log(err); }
  );
}

function cached_retrieve_temperature(cb) {
  return get_and_cache("temperature", 1000 * 60 * 120, retrieve_temperature, cb);
}

// Display the updated temperature
function update_temperature() {
  cached_retrieve_temperature(function(data) {
    var closest = find_closest_forecast(Math.floor(Date.now() / 1000), data.hourly.data);
    temperature_element.text(Math.round(closest.temperature) + " F");
    
    var d = new Date();
    // The slicing is to enable zero-padding the numbers to 2 digits
    // TODO: This doesn't get set correctly when reading a cached forecast
    // last_update_element.text(("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2));
  });
}

// Get temperature, and schedule future updates
update_temperature();
setInterval(update_temperature, 1000 * 60 * 30);