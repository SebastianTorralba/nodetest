
const socket = io();

socket.on('rfid',function(data){
    console.log(data.toString());
  let rfid =   document.getElementById('sensor');
  rfid.innerHTML = `${data} `;
});

