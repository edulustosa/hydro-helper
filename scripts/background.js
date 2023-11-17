// Create notification
chrome.alarms.onAlarm.addListener(function (alarm) {
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "../assets/images/water-bottle-64.png",
      title: "Stay Hydrated",
      message:
        "Hydration alert! Take a moment to drink some water and refresh.",
    },
    () => {}
  );
});
