const socket = io();

function send() {
  const val = document.getElementById("input").value;
  socket.emit("prompt", val);
}

socket.on("response", (data) => {
  document.getElementById("out").textContent += data + "\n";
});