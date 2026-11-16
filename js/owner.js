// owner.js - helper page for the owner. Turns an approved review into one ready line for reviews.js.

// Build the line from the form every time something is typed
function makeLine() {
  var line = '  { name: ' + JSON.stringify(document.getElementById("oName").value) +     // JSON.stringify adds safe quotes
    ', event: ' + JSON.stringify(document.getElementById("oEvent").value) +
    ', rating: ' + Number(document.getElementById("oRating").value) +
    ', text: ' + JSON.stringify(document.getElementById("oText").value) + ' },';
  document.getElementById("oOut").textContent = line;
}

// Copy the line to the clipboard so it can be pasted into reviews.js
function copyLine() {
  navigator.clipboard.writeText(document.getElementById("oOut").textContent);
  alert("Copied! Now paste it inside the [ ] in js/reviews.js");
}

makeLine();   // show an empty line when the page opens
