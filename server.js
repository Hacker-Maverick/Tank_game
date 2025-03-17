import express from "express"
import path from "path";
import { Server } from "socket.io"
import http from "http"

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Path
const mypath = process.env.MY_PATH || "D:/Git/tank"

// Express Middlewares
app.use(express.static("public"));

// Express endpoints
app.get("/", (req, res) => {
    res.status(200).sendFile(path.join(mypath, "public", "index.html"));
});

app.get("/game", (req, res) => {
    res.status(200).sendFile(path.join(mypath, "public", "game.html"));
})

// Server Listening
server.listen(process.env.PORT || 3000, () => {
    console.log("Server running at https://tank-game-rtlq.onrender.com");
});

//Variables 
var count = 0;
var gameobj = [];

// Game logics
function genroomid() {
    count = count + 1;
    return parseInt(Math.random() * 100000) + count * 100000
}

// Socket connections
io.on("connection", (socket) => {

    // Room create and join
    socket.on("createroom", (submitdata) => {
        submitdata.roomid = genroomid()
        socket.join(submitdata.roomid);
        //assigning values
        let obj = {
            index:null,
            roomid: null,
            userid: null,
            username: null,
            x: null,
            y: null,
            hp: 100,
            bulletx: [],
            bullety: [],
            noz: 0
        }
        obj.roomid = submitdata.roomid;
        obj.userid = socket.id;
        obj.username = submitdata.username;
        obj.x = 25;
        obj.y = 30;
        gameobj[parseInt((submitdata.roomid) / 100000)] = [];
        obj.index=gameobj[parseInt((submitdata.roomid) / 100000)].length;
        gameobj[parseInt((submitdata.roomid) / 100000)].push(obj);
        console.log(`Socket ${socket.id} joined room ${submitdata.roomid}`);
        submitdata.userid = socket.id;
        socket.emit("createroom", submitdata);
    })
    socket.on("joinroom", (submitdata) => {
        if (io.sockets.adapter.rooms.has(submitdata.roomid) && gameobj[parseInt((submitdata.roomid) / 100000)].length < 4) {
            socket.join(submitdata.roomid);
            let obj = {
                index:null,
                roomid: null,
                userid: null,
                username: null,
                x: null,
                y: null,
                hp: 100,
                bulletx: [],
                bullety: [],
                noz: 0
            }
            obj.roomid = submitdata.roomid;
            obj.userid = socket.id;
            obj.username = submitdata.username;
            if (gameobj[parseInt((submitdata.roomid) / 100000)].length == 1) {
                obj.x = 65;
                obj.y = 30;
                obj.noz = 180
            }
            else if (gameobj[parseInt((submitdata.roomid) / 100000)].length == 2) {
                obj.x = 25;
                obj.y = 50;
            }
            else {
                obj.x = 65;
                obj.y = 50;
                obj.noz = 180;
            }
            obj.index=gameobj[parseInt((submitdata.roomid) / 100000)].length;
            gameobj[parseInt((submitdata.roomid) / 100000)].push(obj);
            console.log(`Socket ${socket.id} joined room ${submitdata.roomid}`);
            submitdata.err = null
            submitdata.userid = socket.id
            socket.emit("joinroom", submitdata);
        }
        else if (!(io.sockets.adapter.rooms.has(submitdata.roomid))) {
            submitdata.err = "Room does not exist.";
            socket.emit("joinroom", submitdata);
        }
        else if (gameobj[parseInt((submitdata.roomid) / 100000)].length >= 4) {
            submitdata.err = "Maximum players reached"
            socket.emit("joinroom", submitdata)
        }
        else {
            submitdata.err = "Some error occured. Try creating a new room."
            socket.emit("joinroom", submitdata)
        }
    });
    socket.on("start", (roomid) => {
        io.to(roomid).emit("updateclient", gameobj[parseInt((roomid) / 100000)])
        io.to(roomid).emit("started");
        console.log(gameobj)
    })

    // Game Updates
    socket.on("updateserver", (data) => {
        if (gameobj[parseInt((data.roomid) / 100000)]) {
            gameobj[parseInt((data.roomid) / 100000)][data.index] = data;
            socket.emit("updateclient", gameobj[parseInt((data.roomid) / 100000)])
            checkdeath(data.roomid)
        };
    })

    socket.on("bullethit", (data) => {
        io.to(gameobj[parseInt((data.roomid) / 100000)][data.i].userid).emit("hitconfirm",data.j)
    })

    function checkdeath(roomid) {
        let deathcount=0;
        for (let i = 0; i < gameobj[parseInt(roomid / 100000)].length; i++) {
            if (gameobj[parseInt(roomid / 100000)][i].hp <= 0) {
                deathcount+=1;
                io.to(gameobj[parseInt(roomid / 100000)][i].userid).emit("died")
                io.to(roomid).emit("deadtank",i)
            }
        }
        if(deathcount==((gameobj[parseInt(roomid / 100000)].length)-1)){
            io.to(roomid).emit("win","Congratulations, You Won...")
        }
    }
})
