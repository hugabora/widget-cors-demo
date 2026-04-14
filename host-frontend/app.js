window.addEventListener("widget-message", (event) => {
  const detail = event.detail || {};
  console.log("Widget message event:", detail);
});
