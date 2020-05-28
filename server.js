//#region initialization
var express = require('express');
var app = express();
var serv = require('http').Server(app); 
var io = require('socket.io')(serv, {});
var sleep = require('sleep'); 
app.get('/',function(req,res)
{
    res.sendFile(__dirname +'/index.html');
});

app.use('/', express.static(__dirname + '/'));

SOCKET_LIST = {};
PLAYER_LIST = [];
tilePile = [];
discardPile = [];
winningPosition = -1;
currentTurn = 0;
currentRound = 0;
drawSpeed = 1000;
drawing = false;

var Tile = function(param){
    self={};
    self.type = param.type;
    self.name = param.name;
    self.index = param.index;
    return self;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    
    while (0 !== currentIndex) {
        
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    
    return array;
        
  }

function generatePile(){
    tilePile = []
    for(let i=1;i<10;i++){
        for(let x=1;x<5;x++)
        {
            var newTile = new Tile({
            type:"suit",
            name:"man",
            index:i,
            mainIndex:i
        })
        tilePile.push(newTile)
        }
    }
    for(let i=1;i<10;i++){
        for(let x=1;x<5;x++)
        {
            var newTile = new Tile({
            type:"suit",
            name:"tong",
            index:i
        })
        tilePile.push(newTile)
        }
    }
    for(let i=1;i<10;i++){
        for(let x=1;x<5;x++)
        {
            var newTile = new Tile({
            type:"suit",
            name:"suo",
            index:i
        })
        tilePile.push(newTile)
        }
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"honor",
        name:"dong",
        index:0
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"honor",
        name:"nan",
        index:0
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"honor",
        name:"xi",
        index:0
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"honor",
        name:"bei",
        index:0
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"honor",
        name:"zhong",
        index:0
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"honor",
        name:"baiban",
        index:0
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"honor",
        name:"facai",
        index:0
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"flower",
        name:"hua",
        index:x
    })
    tilePile.push(newTile)
    }
    for(let x=1;x<5;x++)
    {
        var newTile = new Tile({
        type:"flower",
        name:"redhua",
        index:x
    })
    tilePile.push(newTile)
    }
    var newTile = new Tile({
        type:"animal",
        name:"cat",
        index:0})
    tilePile.push(newTile)
    var newTile = new Tile({
        type:"animal",
        name:"mouse",
        index:0})
    tilePile.push(newTile)
    var newTile = new Tile({
        type:"animal",
        name:"chicken",
        index:0})
    tilePile.push(newTile)
    var newTile = new Tile({
        type:"animal",
        name:"centipede",
        index:0})
    tilePile.push(newTile)
}

var update = function(){
    var playerData = []
    flowerData = []
    for(i in PLAYER_LIST)
    {
        flowerData[i] = [];
        for(x in PLAYER_LIST[i].flower) 
        {
            if(PLAYER_LIST[i].flower[x].index == 0)
            flowerData[i].push(PLAYER_LIST[i].flower[x].name)
            else
            flowerData[i].push(PLAYER_LIST[i].flower[x].name + PLAYER_LIST[i].flower[x].index)
        }
    }

    for(i in PLAYER_LIST)
    {
        var shownHandPacket = []
        for(x in PLAYER_LIST[i].shownHand)
        {
            shownHandPacket.push(PLAYER_LIST[i].shownHand[x].display)
        }
        playerData.push({
            position:i,
            name:PLAYER_LIST[i].name,
            handsize:PLAYER_LIST[i].hand.length,
            flower:flowerData[i],
            shownHand:shownHandPacket,
            money:PLAYER_LIST[i].money
            
        })
    }
    var discardPacket = []
    for(i in discardPile)
    {
        if(discardPile[i].index == 0)
        discardPacket.push(discardPile[i].name)
        else
        discardPacket.push(discardPile[i].name + discardPile[i].index)
    }
    for(i in PLAYER_LIST)
    {
        socket = SOCKET_LIST[PLAYER_LIST[i].socketid]
        var packet = []
        for(x in PLAYER_LIST[i].hand)
        {
        if(PLAYER_LIST[i].hand[x].index == 0)
        packet.push(PLAYER_LIST[i].hand[x].name)
        else
        packet.push(PLAYER_LIST[i].hand[x].name + PLAYER_LIST[i].hand[x].index)
        }
        socket.emit("update",
            {packet,
            playerData,
            discardPile:discardPacket})
    }

    io.sockets.emit("tilesLeft",{tilesLeft:tilePile.length})
    }

var givePosition = function(){
    for(i in PLAYER_LIST){
        socket = SOCKET_LIST[PLAYER_LIST[i].socketid]
        socket.emit("yourPosition",{position:i})
    }
}

var searchHand = function(position,name,index){
    for(i in PLAYER_LIST[position].hand)
    {
        if(PLAYER_LIST[position].hand[i].name == name && PLAYER_LIST[position].hand[i].index == index)
        return true
    }
    return false
}

var checkPong = function(position){
        name = discardPile[discardPile.length-1].name;
        index = discardPile[discardPile.length-1].index;
        pongCount = 0;
        for(i in PLAYER_LIST[position].hand)
        {
            if(PLAYER_LIST[position].hand[i].name == name && PLAYER_LIST[position].hand[i].index == index)
            pongCount++;
        }
        if(pongCount>1)
        return true
        else
        return false
}

var checkGang = function(position){
    name = discardPile[discardPile.length-1].name;
    index = discardPile[discardPile.length-1].index;
    pongCount = 0;
    for(i in PLAYER_LIST[position].hand)
    {
        if(PLAYER_LIST[position].hand[i].name == name && PLAYER_LIST[position].hand[i].index == index)
        pongCount++;
    }
    if(pongCount>2)
    return true
    else
    return false
}

var checkAnGang = function(position){
    var testAnGang = JSON.parse(JSON.stringify(PLAYER_LIST[position].hand));
    testAnGang.sort(compareHand)
    for(let i = 0; i < PLAYER_LIST[position].hand.length-3;i++)
    {
        if(testAnGang[i].name == testAnGang[parseInt(i)+1].name 
        && testAnGang[i].index == testAnGang[parseInt(i)+1].index
        && testAnGang[i].name == testAnGang[parseInt(i)+2].name 
        && testAnGang[i].index == testAnGang[parseInt(i)+2].index
        && testAnGang[i].name == testAnGang[parseInt(i)+3].name 
        && testAnGang[i].index == testAnGang[parseInt(i)+3].index)
        return true
    }
    return false
}

var checkMingGang = function(position){
    
    for(let i in PLAYER_LIST[position].hand)
    {
        for(let x in PLAYER_LIST[position].shownHand)
        {
            if(PLAYER_LIST[position].shownHand[x].type == "pong")
            {
            if(PLAYER_LIST[position].hand[i].index == PLAYER_LIST[position].shownHand[x].index && PLAYER_LIST[position].hand[i].name == PLAYER_LIST[position].shownHand[x].name)
            return true
            }
        }
    }
    return false
}

var checkChi = function(position){
    if(discardPile.length != 0)
    {
    tile = discardPile[discardPile.length-1]
    if(tile.index != 0)
    {
        if(searchHand(position,tile.name,tile.index+1) && searchHand(position,tile.name,tile.index-1))
        {
            return true
            }
        if(searchHand(position,tile.name,tile.index-1) && searchHand(position,tile.name,tile.index-2))
        {
            return true
            }
        if(searchHand(position,tile.name,tile.index+1) && searchHand(position,tile.name,tile.index+2))
        {
            return true
            }
    }
    return false
}
}

var Player = function(param){
    self={};
    self.socketid = param.socketid;
    self.name = param.username;
    self.hand = [];
    self.flower = [];
    self.shownHand = [];
    self.position = 0;
    self.roll = 0;
    self.money = 20.0;

    PLAYER_LIST.push(self);

    return self;
}

function compareHand( a, b ) {
    if ( a.type > b.type ){
        return -1;
      }
      if ( a.type < b.type ){
        return 1;
      }
    if ( a.name < b.name ){
      return -1;
    }
    if ( a.name > b.name  ){
      return 1;
    }
    if ( a.index < b.index ){
        return -1;
      }
      if ( a.index > b.index ){
        return 1;
      }
    return 0;
  }

var currentSocket;
var beginRoll = function(){
    var x =0;
    currentSocket = 0;
    for(let i in PLAYER_LIST){
        if(x==0)
        {
        socket = SOCKET_LIST[PLAYER_LIST[i].socketid]
        socket.emit("startRoll")
        currentSocket++;
    }
    x++
}
}

var sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

var endTable = async function(){
    if(winningPosition != 0 && winningPosition != -1)
    {
    currentRound++;
    console.log(currentRound)
    currentFong = Math.floor(currentRound/4)
    io.sockets.emit("currentFong",{currentFong:currentFong
        }) 
    temp = PLAYER_LIST[0]
    for(i in PLAYER_LIST)
    {
        if(i<3)
        {
            PLAYER_LIST[i]=PLAYER_LIST[parseInt(i)+1]
        }
    }
    PLAYER_LIST[3] = temp;
    }
    for(let i in PLAYER_LIST)
    {
        PLAYER_LIST[i].hand = []
        PLAYER_LIST[i].flower = []
        PLAYER_LIST[i].shownHand =[]
    }
    io.sockets.emit("updateTurn",{currentTurn:0})
    io.sockets.emit("reset")
    io.sockets.emit("tilesLeft",{tilesLeft:-1})
    console.log(PLAYER_LIST)    
    startTable();
}

var  startTable = async function(){
    winningPosition = -1;   
    currentTurn = 0;
    givePosition();
    generatePile()
    shuffle(tilePile)
    currentFong = Math.floor(currentRound/4)     
    io.sockets.emit("currentFong",{currentFong:currentFong
    }) 
    io.sockets.emit("hideDice")
    discardPile = []
    for(let i in PLAYER_LIST)
    {
        PLAYER_LIST[i].hand = []
        PLAYER_LIST[i].flower = []
        PLAYER_LIST[i].shownHand =[]
    }
    for(let g=0;g<3;g++ )
    {
        for(let i in PLAYER_LIST)
        {
            for(let x=0;x<4;x++ )
            {
                PLAYER_LIST[i].hand.push(tilePile[tilePile.length-1]);
                tilePile.pop();
            }
            await sleep(300);
            PLAYER_LIST[i].hand.sort(compareHand)
            io.sockets.emit("playTak");
            update()
        }
    }    
    for(let i in PLAYER_LIST)
    {
        if(i == 0)
        {
            PLAYER_LIST[i].hand.push(tilePile[tilePile.length-1]);
            tilePile.pop();
        }
        PLAYER_LIST[i].hand.push(tilePile[tilePile.length-1]);
        tilePile.pop();
        PLAYER_LIST[i].hand.sort(compareHand)
        io.sockets.emit("playTak");
        update()
    }
    var noreplace = false;
    while (noreplace == false){
    noreplace = true;
    for(let i in PLAYER_LIST)
    {
        for(x in PLAYER_LIST[i].hand)
        {
            if(PLAYER_LIST[i].hand[x].type == "animal" || PLAYER_LIST[i].hand[x].type == "flower")
            {
                PLAYER_LIST[i].flower.push(PLAYER_LIST[i].hand[x]);
                PLAYER_LIST[i].hand.splice(x,1);
                PLAYER_LIST[i].hand.push(tilePile[tilePile.length-1]);
                tilePile.pop();
                noreplace = false;
                PLAYER_LIST[i].hand.sort(compareHand)
                io.sockets.emit("playTak");
                update()
                await sleep(1000);
            }
        }
        }
    }   
    var socket = SOCKET_LIST[PLAYER_LIST[0].socketid]
    if(checkAnGang(0))
    {
        socket.emit("angang");
    }
    io.sockets.emit("tilesLeft",{tilesLeft:tilePile.length})
    socket.emit("discard")
    console.log("table started")
}


io.sockets.on('connection', function (socket) {
    if(PLAYER_LIST.length>3)
    {
        socket.emit("checkID");
    }
    else
    {
        socket.id = Math.random(); 
        SOCKET_LIST[socket.id] = socket;
        console.log("Connected")
    }

    socket.on('ID',function(data){
        let uid = data.socketid;
        for(let i in PLAYER_LIST)
        {
            if(PLAYER_LIST[i].socketid == uid)
            {
                SOCKET_LIST[uid]=socket
                socket.emit("closeUsername",{
                    socketid:uid
                })
                io.sockets.emit("updateTurn",{currentTurn:currentTurn})
                socket.emit("yourPosition",{position:i})
                socket.emit("retrieve")
                if(i == currentTurn && drawing == false)
                socket.emit("draw")
            }
        }
        update();
    })

    socket.on('disconnect', function () {
        console.log("Disconnect")

    });

    socket.on("chat",function(data){
        name = PLAYER_LIST[data.myPosition].name;
        var text = name + ": " + data.text;
        io.sockets.emit("addText",{
            text:text
        })
    })

    socket.on("knock",function(){
        io.sockets.emit("playKnock");
    })

    socket.on("coffin",function(){
        io.sockets.emit("playCoffin");
    })  

    socket.on("wow",function(){
        io.sockets.emit("playWow");
    })

    socket.on("cao",function(){
        io.sockets.emit("playCao");
    })

    socket.on("what",function(){
        io.sockets.emit("playWhat");
    })


    socket.on("setSpeed",function(data){
        drawSpeed = data.speed;
        var text = "Draw speed set to " + data.speed + "ms"
        io.sockets.emit("addText",{
            text:text
        })
    })


    socket.on("pay",function(data){
        var name = PLAYER_LIST[data.myPosition].name;
        var position = (parseInt(data.myPosition)+parseInt(data.position))%4;
        var text = name + " paid $" + data.amount.toFixed(2) + " to " + PLAYER_LIST[position].name;
        PLAYER_LIST[data.myPosition].money -= data.amount;
        PLAYER_LIST[position].money += data.amount;
        update();
        io.sockets.emit("addText",{
            text:text
        })
    })


    socket.on('username', function(data){
    new Player({
            username:data.username,
            socketid:socket.id
        }) 
        socket.emit("closeUsername",{
            socketid:socket.id
        })
        if(PLAYER_LIST.length == 4)
        beginRoll();
    console.log(PLAYER_LIST)
    })
   
    
    socket.on("discard",function(data){
        drawing = false;
        discardPile.push(PLAYER_LIST[data.myPosition].hand[data.selection])
        io.sockets.emit("playTak");
        PLAYER_LIST[data.myPosition].hand.splice(data.selection,1)
        SOCKET_LIST[PLAYER_LIST[data.myPosition].socketid].emit("endDiscard");
        var tempsock = SOCKET_LIST[PLAYER_LIST[(parseInt(data.myPosition)+1)%4].socketid]
        tempsock.emit("draw");
        if(checkChi((parseInt(data.myPosition)+1)%4))
        tempsock.emit("chi");
        PLAYER_LIST[data.myPosition].hand.sort(compareHand)
        update();
        for(let i in PLAYER_LIST)
        {
            if(checkPong(i) && i!= data.myPosition)
            {
            SOCKET_LIST[PLAYER_LIST[i].socketid].emit("pong1");
            }
        }

        for(let i in PLAYER_LIST)
        {
            if(checkGang(i) && i!= data.myPosition)
            {
            SOCKET_LIST[PLAYER_LIST[i].socketid].emit("gang");
            }
        }
        for(let i in PLAYER_LIST)
        {
            if(i!= data.myPosition)
            {
            SOCKET_LIST[PLAYER_LIST[i].socketid].emit("hu");
            }
        }
        if(tilePile.length<16)
        {
            io.sockets.emit("reset")
            endTable()
        }
        currentTurn = (parseInt(data.myPosition)+1)%4;
        io.sockets.emit("updateTurn",{currentTurn:currentTurn})
    })

    var draw = async function(myPosition){
        await sleep(drawSpeed);
        if(myPosition == currentTurn)
        {
        drawing = true;
        io.sockets.emit("updateTurn",{currentTurn:currentTurn})
        PLAYER_LIST[myPosition].hand.push(tilePile[tilePile.length-1]);
        tilePile.pop();
        var noreplace = false;
        while (noreplace == false){
            noreplace = true;
                for(x in PLAYER_LIST[myPosition].hand)
                {
                    if(PLAYER_LIST[myPosition].hand[x].type == "animal" || PLAYER_LIST[myPosition].hand[x].type == "flower")
                    {
                        PLAYER_LIST[myPosition].flower.push(PLAYER_LIST[myPosition].hand[x]);
                        PLAYER_LIST[myPosition].hand.splice(x,1);
                        PLAYER_LIST[myPosition].hand.push(tilePile[tilePile.length-1]);
                        tilePile.pop();
                        noreplace = false;
                        io.sockets.emit("playHua")
                        update()
                        await sleep(500);
                    }
                }
                }
        if(checkAnGang(myPosition))
        {
            SOCKET_LIST[PLAYER_LIST[myPosition].socketid].emit("angang");
        }
        if(checkMingGang(myPosition))
        {
            SOCKET_LIST[PLAYER_LIST[myPosition].socketid].emit("minggang");
        }
        SOCKET_LIST[PLAYER_LIST[myPosition].socketid].emit("drawDone");
        for(let i in PLAYER_LIST)
        {
            if(i!= myPosition)
            {
            SOCKET_LIST[PLAYER_LIST[i].socketid].emit("hidehu");
            }
        }
        
        update();
    }
    }

    socket.on("draw",function(data){
        draw(data.myPosition);
    })

    socket.on("chi",function(data){
        var tile = []
        var name = discardPile[discardPile.length-1].name
        if(PLAYER_LIST[data.myPosition].hand[data.selection2].name == name && PLAYER_LIST[data.myPosition].hand[data.selection].name == name )
        {
            var index1 = PLAYER_LIST[data.myPosition].hand[data.selection2].index;
            var index2 = PLAYER_LIST[data.myPosition].hand[data.selection].index;
            var mark1 = data.selection2;
            var mark2 = data.selection;
            var indexMain = discardPile[discardPile.length-1].index
            if(index2 < index1)
            {
                var temp = index1;
                index1 = index2;
                index2 = temp;
                var temp = mark1;
                mark1 = mark2;
                mark2 = temp;
            }
            if(index1 == indexMain-1 && index2 == indexMain + 1)
            {
                tile[0] = PLAYER_LIST[data.myPosition].hand.splice(mark1,1);
                tile[1] = discardPile.splice(discardPile.length-1,1);
                tile[2] = PLAYER_LIST[data.myPosition].hand.splice(mark2-1,1);
            }
            else if(index1 == indexMain-2 && index2 == indexMain -1)
            {
                tile[0] = PLAYER_LIST[data.myPosition].hand.splice(mark1,1);
                tile[1] = PLAYER_LIST[data.myPosition].hand.splice(mark2-1,1);
                tile[2] = discardPile.splice(discardPile.length-1,1);
            }
            else if(index1 == indexMain+1 && index2 == indexMain +2)
            {
                tile[0] = discardPile.splice(discardPile.length-1,1);
                tile[1] = PLAYER_LIST[data.myPosition].hand.splice(mark1,1);
                tile[2] = PLAYER_LIST[data.myPosition].hand.splice(mark2-1,1);
            }
            else
            return
            PLAYER_LIST[data.myPosition].shownHand.push(    
                {
                    type:"chi",
                    name:name,
                    tiletype:"suit",
                    display:[tile[0][0].name+tile[0][0].index,tile[1][0].name+tile[1][0].index,tile[2][0].name+tile[2][0].index]
                }
            )
            SOCKET_LIST[PLAYER_LIST[data.myPosition].socketid].emit("discard");
            PLAYER_LIST[data.myPosition].hand.sort(compareHand)
            update();   }
            for(let i in PLAYER_LIST)
            {
                if(i!= data.myPosition)
                {
                SOCKET_LIST[PLAYER_LIST[i].socketid].emit("hidehu");
                }
            }
    })

    socket.on("pong2",function(data){
        if(drawing == false)
        {
        var position = data.myPosition
        io.sockets.emit("clearAll")
        io.sockets.emit("playPong")
        currentTurn = data.myPosition
        io.sockets.emit("updateTurn",{currentTurn:currentTurn})
        var name = discardPile[discardPile.length-1].name;
        var index = discardPile[discardPile.length-1].index;
        var tiletype = discardPile[discardPile.length-1].type;
        popped = false;
        for(i in PLAYER_LIST[data.myPosition].hand)
        {
            if(PLAYER_LIST[data.myPosition].hand[i].name == discardPile[discardPile.length-1].name && PLAYER_LIST[data.myPosition].hand[i].index == discardPile[discardPile.length-1].index && popped== false)
            {
                popped = true;
                PLAYER_LIST[data.myPosition].hand.splice(i,1);
            }

        }
        popped = false;
        for(i in PLAYER_LIST[data.myPosition].hand)
        {
            if(PLAYER_LIST[data.myPosition].hand[i].name == discardPile[discardPile.length-1].name && PLAYER_LIST[data.myPosition].hand[i].index == discardPile[discardPile.length-1].index && popped== false)
            {
                popped = true;
                PLAYER_LIST[data.myPosition].hand.splice(i,1);
            }

        }
        if(index != 0)
        {
        PLAYER_LIST[data.myPosition].shownHand.push(    
            {
                type:"pong",
                name:name,
                tiletype:tiletype,
                index:index,
                display:[name+index,name+index,name+index]
            }
        )
        }
        else
        {
            PLAYER_LIST[data.myPosition].shownHand.push(    
                {
                    type:"pong",
                    name:name,
                    tiletype:tiletype,
                    index:index,
                    display:[name,name,name]
                })
        }
        discardPile.pop();
        SOCKET_LIST[PLAYER_LIST[data.myPosition].socketid].emit("discard");
        update();
        for(let i in PLAYER_LIST)
        {
            if(i!= data.myPosition)
            {
            SOCKET_LIST[PLAYER_LIST[i].socketid].emit("hidehu");
            }
        }
    }})

    socket.on("hu",function(data){
        var position = data.myPosition
        var totalHand = 0;
        for(x in PLAYER_LIST[position].shownHand)
        {
            totalHand += 3
        }
        console.log(totalHand,PLAYER_LIST[position].hand.length)
        if(PLAYER_LIST[position].hand.length + totalHand != 14)
        {
            PLAYER_LIST[position].hand.push(discardPile[discardPile.length-1])
            discardPile.pop();
        }
        PLAYER_LIST[position].hand.sort(compareHand)
        update();
        handData = [];
        for(x in PLAYER_LIST[position].hand) 
            {
                if(PLAYER_LIST[position].hand[x].index == 0)
                handData.push(PLAYER_LIST[position].hand[x].name)
                else    
                handData.push(PLAYER_LIST[position].hand[x].name + PLAYER_LIST[position].hand[x].index)
            }
        io.sockets.emit("win",{
            position:position,
            hand:handData,
        })
        winningPosition = position;
        var tempsock = SOCKET_LIST[PLAYER_LIST[(parseInt(data.myPosition)+1)%4].socketid]
        tempsock.emit("endround");
        
    })

    socket.on("endround",function(){
        endTable()
    })
    socket.on("gang",function(data){
        var position = data.myPosition
        io.sockets.emit("clearAll")
        io.sockets.emit("playGang")
        currentTurn = data.myPosition
        io.sockets.emit("updateTurn",{currentTurn:currentTurn})
        var name = discardPile[discardPile.length-1].name;
        var index = discardPile[discardPile.length-1].index;
        var tiletype = discardPile[discardPile.length-1].type;
        popped = false;
        for(i in PLAYER_LIST[data.myPosition].hand)
        {
            if(PLAYER_LIST[data.myPosition].hand[i].name == discardPile[discardPile.length-1].name && PLAYER_LIST[data.myPosition].hand[i].index == discardPile[discardPile.length-1].index && popped== false)
            {
                popped = true;
                PLAYER_LIST[data.myPosition].hand.splice(i,1);
            }

        }
        popped = false;
        for(i in PLAYER_LIST[data.myPosition].hand)
        {
            if(PLAYER_LIST[data.myPosition].hand[i].name == discardPile[discardPile.length-1].name && PLAYER_LIST[data.myPosition].hand[i].index == discardPile[discardPile.length-1].index && popped== false)
            {
                popped = true;
                PLAYER_LIST[data.myPosition].hand.splice(i,1);
            }

        }
        popped = false;
        for(i in PLAYER_LIST[data.myPosition].hand)
        {
            if(PLAYER_LIST[data.myPosition].hand[i].name == discardPile[discardPile.length-1].name && PLAYER_LIST[data.myPosition].hand[i].index == discardPile[discardPile.length-1].index && popped== false)
            {
                popped = true;
                PLAYER_LIST[data.myPosition].hand.splice(i,1);
            }

        }
        if(index != 0)
        {
        PLAYER_LIST[data.myPosition].shownHand.push(    
            {
                type:"pong",
                name:name,
                tiletype:tiletype,
                display:[name+index,name+index,name+index,name+index]
            }
        )
        }
        else
        {
            PLAYER_LIST[data.myPosition].shownHand.push(    
                {
                    type:"pong",
                    name:name,
                    tiletype:tiletype,
                    display:[name,name,name,name]
                })
        }
        discardPile.pop();
        SOCKET_LIST[PLAYER_LIST[data.myPosition].socketid].emit("draw");
        update();
        for(let i in PLAYER_LIST)
        {
            if(i!= data.myPosition)
            {
            SOCKET_LIST[PLAYER_LIST[i].socketid].emit("hidehu");
            }
        }
    })

    socket.on("angang",function(data){

        var position = data.myPosition;
        PLAYER_LIST[position].hand.sort(compareHand)
        for(let i = 0; i < PLAYER_LIST[position].hand.length-3;i++)
        {
            if(PLAYER_LIST[position].hand[i].name == PLAYER_LIST[position].hand[parseInt(i)+1].name 
            && PLAYER_LIST[position].hand[i].index == PLAYER_LIST[position].hand[parseInt(i)+1].index
            && PLAYER_LIST[position].hand[i].name == PLAYER_LIST[position].hand[parseInt(i)+2].name 
            && PLAYER_LIST[position].hand[i].index == PLAYER_LIST[position].hand[parseInt(i)+2].index
            && PLAYER_LIST[position].hand[i].name == PLAYER_LIST[position].hand[parseInt(i)+3].name 
            && PLAYER_LIST[position].hand[i].index == PLAYER_LIST[position].hand[parseInt(i)+3].index)
            {
                var index = PLAYER_LIST[data.myPosition].hand[i].index
                var name = PLAYER_LIST[data.myPosition].hand[i].name
                var tiletype = PLAYER_LIST[data.myPosition].hand[i].type
                PLAYER_LIST[data.myPosition].hand.splice(i,4);
                if(index != 0)
                {
                PLAYER_LIST[data.myPosition].shownHand.push(    
                    {
                        type:"pong",
                        name:name,
                        tiletype:tiletype,
                        display:[name+index,name+index,name+index,name+index]
                    }
                )
                }
                else
                {
                    PLAYER_LIST[data.myPosition].shownHand.push(    
                        {
                            type:"pong",
                            name:name,
                            tiletype:tiletype,
                            display:[name,name,name,name]
                        })
                }
                update();
                SOCKET_LIST[PLAYER_LIST[data.myPosition].socketid].emit("draw");
                return
            }
        }

    })

    socket.on("minggang",function(data){
        var position = data.myPosition;
        for(let i in PLAYER_LIST[position].hand)
        {
            for(let x in PLAYER_LIST[position].shownHand)
            {
                if(PLAYER_LIST[position].shownHand[x].type == "pong")
                {
                if(PLAYER_LIST[position].hand[i].index == PLAYER_LIST[position].shownHand[x].index && PLAYER_LIST[position].hand[i].name == PLAYER_LIST[position].shownHand[x].name)
                    {
                        PLAYER_LIST[position].hand.splice(i,1);
                        if(PLAYER_LIST[position].shownHand[x].index == 0)
                        PLAYER_LIST[position].shownHand[x].display.push(PLAYER_LIST[position].shownHand[x].name);
                        else
                        PLAYER_LIST[position].shownHand[x].display.push(PLAYER_LIST[position].shownHand[x].name + PLAYER_LIST[position].shownHand[x].index);
                        update();
                        SOCKET_LIST[PLAYER_LIST[data.myPosition].socketid].emit("draw");
                        return
                    }
                }
            }
        }
    })

    socket.on('roll', function (data) {
        var x = 0;
        results = {
            dice1: Math.ceil(Math.random() * 5),
            dice2: Math.ceil(Math.random() * 5),
            dice3: Math.ceil(Math.random() * 5)
        }
        for(let i in PLAYER_LIST){
            if(PLAYER_LIST[i].socketid==data.socketid)
            PLAYER_LIST[i].roll=results.dice1+results.dice2+results.dice3;
        }
        for(let i in PLAYER_LIST){
            sockets = SOCKET_LIST[PLAYER_LIST[i].socketid]
            sockets.emit("result",results)}
        for(let i in PLAYER_LIST){
            if(x==currentSocket)
            {
                socket = SOCKET_LIST[PLAYER_LIST[i].socketid]
                socket.emit("startRoll")
                currentSocket++;
                return
            }
            x++;
        }   
        if(currentSocket==4)
        {
            for (var i = 0; i < 3; i++) {
                var j_min = i;
                for (var j = i + 1; j < 4; j = j + 1) {
                    if (PLAYER_LIST[j].roll > PLAYER_LIST[j_min].roll) {
                        j_min = j;
                    }}
                if(j_min !== i){
                    var temp = PLAYER_LIST[i];
                    PLAYER_LIST[i] = PLAYER_LIST[j_min];
                    PLAYER_LIST[j_min] = temp;
                }
            }
        
    }
        startTable();   
    });


})


serv.listen(80);
console.log("Server started.");

