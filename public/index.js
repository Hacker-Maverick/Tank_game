const socket = io("https://tank-game-rtlq.onrender.com");

// Variables
let submit = { username: null, roomid: null };
let gameobj, obj, socketid;
let bullet = [];


// Event Listeners
document.getElementById("create").addEventListener("click", () => {

    document.getElementById("createjoin").style.display = "none";
    document.getElementById("inputfields").style.display = "flex";
    submit.username = document.getElementById("username").value;
    document.getElementById("createbutton").style.display = "flex";

})

document.getElementById("join").addEventListener("click", async () => {
    document.getElementById("createjoin").style.display = "none";
    document.getElementById("inputfields").style.display = "flex";
    document.getElementById("roominput").style.display = "flex";
    document.getElementById("joinbutton").style.display = "flex";

})

document.getElementById("createbutton").addEventListener("click", () => {
    if (document.getElementById("username").value) {
        submit.username = document.getElementById("username").value;
        submit.roomid = null;
        socket.emit("createroom", submit);
    }
    else {
        alert("Please enter a username")
    }
})

document.getElementById("joinbutton").addEventListener("click", () => {
    if (document.getElementById("username").value && document.getElementById("roomid").value) {
        submit.username = document.getElementById("username").value;
        submit.roomid = parseInt(document.getElementById("roomid").value);
        socket.emit("joinroom", submit);
    }
    else {
        alert("Please enter a username and valid Room-ID")
    }
})

document.getElementById("start").addEventListener("click", () => {
    socket.emit("start", submit.roomid)
})

// Getting socket data
socket.on("joinroom", (data) => {
    if (data.err) {
        alert(data.err);
    }
    else {
        document.getElementById("inputfields").style.display = "none";
        document.getElementById("roominput").style.display = "none";
        document.getElementById("joinbutton").style.display = "none";
        document.getElementById("created").style.display = "flex";
        document.getElementById("roomjoined").style.display = "flex";
        document.getElementById("roomjoined").innerHTML = `<div>Room joined successfully.</div><div>Room ID : ${data.roomid}</div>`
        socketid = data.userid
    }
})

socket.on("createroom", (data) => {
    document.getElementById("inputfields").style.display = "none";
    document.getElementById("createbutton").style.display = "none";
    document.getElementById("created").style.display = "flex";
    document.getElementById("roomoutput").style.display = "flex";
    document.getElementById("display").innerHTML = `<div>Room created successfully.</div><div>Room ID : ${data.roomid}</div>`
    socketid = data.userid
    submit.roomid = data.roomid;
})

socket.on("started", () => {
    document.body.innerHTML = `<div id='scorecard' style='height:10vh; display:flex;'></div><div style='display:flex; justify-content:center;'><div id='playzone' style='height:90vh; width:90vh; position:relative; background-image:url("bg.jpg");'></div></div>`;
    document.body.style.backgroundImage = 'url("images.jpeg")';
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize ="100% 100%" 

    for (let i = 0; i < gameobj.length; i++) {
        document.getElementById("scorecard").innerHTML += `<div style="width:100%;">
        <div id="${i}username" style="height: 3vh; margin: 1vh; margin-bottom:0vh;"><strong style="text-shadow:1px 1px 2px white">${gameobj[i].username}</strong></div>
        <div id="${i}hpdiv" style="height: 4vh; border: 2px solid black; margin: 1vh">
        <div id="${i}hp" style="height: 100%; width:100%; background-color:blue;"></div></div></div>`
    }

    for (let i = 0; i < gameobj.length; i++) {
        document.getElementById("playzone").innerHTML += `<div style="height:5vh; width:5vh; background-color:rgb(1, 151, 1); position: absolute; border-radius: 10px;" id="${i}">
        <div id="noz${i}" style=" height: 1vh; width: 10vh; margin-top:2vh; margin-left: -2.5vh; ">
            <div style="height: 1vh; width: 5vh; background-color: rgb(0, 72, 0); margin-left: 4.8vh; border-top-left-radius: 100px; border-bottom-left-radius: 100px;">
            </div>
        </div>
    </div>`
    }

    // game updates
    const getupdates = setInterval(() => {
        socket.emit("updateserver", obj);
    }, 5);
    console.log(gameobj);
    render();
    controls();
})

socket.on("updateclient", (data) => {
    gameobj = data;
    obj = gameobj.find(obj => obj.userid === socketid);
    checkhit();
})

socket.on("died", () => {
    alert("youdied")
    socket.emit("updateserver", obj)
    socket.disconnect();
    window.location.href="https://tank-game-rtlq.onrender.com"
})

socket.on("hitconfirm", (index) => {
    clearInterval(bullet[index]);
    obj.bulletx[index] = -100;
    obj.bullety[index] = -100;
})

socket.on("win", (data) => {alert(data);socket.disconnect();window.location.href="https://tank-game-rtlq.onrender.com";})

socket.on("deadtank", (index) => { document.getElementById(index).style.display = "none" })

// Game logics
function render() {
    for (let i = 0; i < gameobj.length; i++) {
        document.getElementById(`noz${i}`).style.transform = `rotate(${gameobj[i].noz}deg)`;
        document.getElementById(`${i}`).style.top = `${gameobj[i].y}vh`;
        document.getElementById(`${i}`).style.left = `${gameobj[i].x}vh`;
        for (let j = 0; j < gameobj[i].bulletx.length; j++) {
            if (gameobj[i].bullety[j] == -100) {
                document.getElementById(i + "" + j).style.display="none"
                document.getElementById(i + "" + j).style.display="none"
            }
            else if (document.getElementById(i + "" + j)) {
                document.getElementById(i + "" + j).style.top = `${gameobj[i].bullety[j]}vh`;
                document.getElementById(i + "" + j).style.left = `${gameobj[i].bulletx[j]}vh`;
            }
            else {
                document.getElementById("playzone").innerHTML += `<div id="${i + "" + j}" style="background-color:red;height:1vh;width:1vh;border-radius:1vh;position:absolute;z-index:10;"></div>`
            }
        }
    }
    requestAnimationFrame(render);
    renderhp();
}

function renderhp() {
    for (let i = 0; i < gameobj.length; i++) {
        document.getElementById(`${i}hp`).style.width = `${gameobj[i].hp}%`;
    }
}

//controls
function controls() {
    let pressed = [null, null, null, null, null, null];

    document.addEventListener("keydown", (e) => {
        if (!pressed[0] && e.key == "w") {
            pressed[0] = setInterval(() => {
                if (obj.y > 0) { obj.y -= 0.25; }
            }, 20);
        }
        if (!pressed[1] && e.key == "a") {
            pressed[1] = setInterval(() => {
                if (obj.x > 0) { obj.x -= 0.25; }
            }, 20);
        }
        if (!pressed[2] && e.key == "s") {
            pressed[2] = setInterval(() => {
                if (obj.y < 85) { obj.y += 0.25; }
            }, 20);
        }
        if (!pressed[3] && e.key == "d") {
            pressed[3] = setInterval(() => {
                if (obj.x < 85) { obj.x += 0.25; }
            }, 20);
        }
        if (!pressed[4] && e.key == "ArrowLeft") {
            pressed[4] = setInterval(() => {
                obj.noz -= 2;
            }, 20);
        }
        if (!pressed[5] && e.key == "ArrowRight") {
            pressed[5] = setInterval(() => {
                obj.noz += 2;
            }, 20);
        }
    })
    document.addEventListener("keyup", (e) => {
        if (pressed[0] && e.key == "w") { clearInterval(pressed[0]); pressed[0] = null; }
        if (pressed[1] && e.key == "a") { clearInterval(pressed[1]); pressed[1] = null; }
        if (pressed[2] && e.key == "s") { clearInterval(pressed[2]); pressed[2] = null; }
        if (pressed[3] && e.key == "d") { clearInterval(pressed[3]); pressed[3] = null; }
        if (pressed[4] && e.key == "ArrowLeft") { clearInterval(pressed[4]); pressed[4] = null; }
        if (pressed[5] && e.key == "ArrowRight") { clearInterval(pressed[5]); pressed[5] = null; }
    })

    document.addEventListener("keyup", async (e) => {
        if (e.code == "Space") {
            let initx = obj.x + 2,
                inity = obj.y + 2,
                index = obj.bulletx.length,
                initnoz = obj.noz;

            // Set initial bullet position
            obj.bulletx[index] = initx;
            obj.bullety[index] = inity;

            // Convert angle to radians
            let angleRad = initnoz * Math.PI / 180; // Subtract 90° to align with up direction

            // Define bullet speed
            let speed = 0.5;  // You can adjust speed as needed

            // Calculate velocity components
            let vx = speed * Math.cos(angleRad);
            let vy = speed * Math.sin(angleRad);

            // Move bullet
            bullet.push(setInterval(() => {
                obj.bulletx[index] += vx;  // Move in x direction
                obj.bullety[index] += vy;  // Move in y direction (canvas inverted)

                // Stop bullet if it goes out of bounds
                if (obj.bulletx[index] < 0 || obj.bulletx[index] > 89 ||
                    obj.bullety[index] < 0 || obj.bullety[index] > 89) {
                    clearInterval(bullet[index]);
                    obj.bulletx[index] = -100;
                    obj.bullety[index] = -100;
                }

            }, 10));
        }
    });


}

let flagi, flagj;
function checkhit() {

    for (let i = 0; i < gameobj.length; i++) {
        if (gameobj[i].userid == socketid) {
            continue;
        }
        for (let j = 0; j < gameobj[i].bulletx.length; j++) {
            if (flagi == i && flagj == j) { continue }
            if ((obj.x < (gameobj[i].bulletx[j] + 0.5)) && ((obj.x + 5) > (gameobj[i].bulletx[j] + 0.5)) && (obj.y < (gameobj[i].bullety[j] + 0.5)) && ((obj.y + 5) > (gameobj[i].bullety[j] + 0.5))) {
                obj.hp = obj.hp - 20;
                flagi = i; flagj = j;
                socket.emit("bullethit", { roomid: obj.roomid, i: i, j: j })
            }
        }
    }
}
