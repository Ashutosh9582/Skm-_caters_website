// photos.js - CHANGE 23: database ki photos gallery me dikhao (owner.html se upload hoti hain)
if (dbReady()) {
  db.collection("photos").orderBy("created", "desc").get().then(function (snap) {
    var grid = document.getElementById("photoGrid");
    if (snap.empty || !grid) return;
    snap.forEach(function (d) {
      var col = document.createElement("div"); col.className = "col-md-3 col-sm-4 col-xs-6"; col.style.marginBottom = "15px";
      var img = document.createElement("img"); img.src = d.data().data; img.alt = d.data().caption || "SKM Caters event"; img.style.width = "100%";
      col.appendChild(img); grid.appendChild(col);
    });
    grid.style.display = "block";
  });
}
