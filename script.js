const peer = new Peer();
let connections = [];
let userName = "";
let teamMembers = {}; // Stores connected user names

// Listen for when the peer connection is established
peer.on("open", (id) => {
    document.getElementById("peerId").innerText = `Your ID: ${id}`;
    console.log("Your Peer ID:", id);
});

// Listen for incoming connections
peer.on("connection", (conn) => {
    conn.on("open", () => {
        console.log("New connection from:", conn.peer);
        connections.push(conn);

        conn.send({ type: "team-list", members: teamMembers });
        conn.send({ type: "new-user", id: peer.id, name: userName });

        broadcast({ type: "new-user", id: peer.id, name: userName }, conn);

        conn.on("data", (msg) => handleIncomingMessage(msg, conn));
    });
});

// Handle incoming messages
function handleIncomingMessage(msg, conn) {
    if (msg.type === "new-user") {
        if (!teamMembers[msg.id]) {
            console.log("New user joined:", msg.name);
            addTeamMember(msg.id, msg.name);
            teamMembers[msg.id] = msg.name;

            broadcast(msg, conn);
        }
    } else if (msg.type === "team-list") {
        console.log("Received team list:", msg.members);
        for (let id in msg.members) {
            if (!teamMembers[id]) {
                addTeamMember(id, msg.members[id]);
                teamMembers[id] = msg.members[id];
            }
        }
    } else if (msg.type === "message") {
        displayMessage(`${msg.name}: ${msg.text}`, false);
        broadcast(msg, conn); 
    }
}


function broadcast(msg, excludeConn = null) {
    connections.forEach(conn => {
        if (conn !== excludeConn) {
            conn.send(msg);
        }
    });
}

// Create a team
function createTeam() {
    userName = document.getElementById("HostName").value.trim();
    if (!userName) {
        alert("Enter Username");
        return;
    }
    document.getElementById("login").style.display = "none";
    document.getElementById("peerId").innerText = `Your ID: ${peer.id}`;

    addTeamMember(peer.id, userName );
    teamMembers[peer.id] = userName;
}

// Join a team using a Team Code
function connectToPeer(peerId) {
    userName = document.getElementById("joineeName").value.trim();
    if (!userName || !peerId) {
        alert("Enter Username & Team Code");
        return;
    }

    let conn = peer.connect(peerId);
    conn.on("open", () => {
        connections.push(conn);
        document.getElementById("login").style.display = "none";
        document.getElementById("peerId").innerText = `Your ID: ${peer.id}`;

        conn.send({ type: "new-user", id: peer.id, name: userName });

        addTeamMember(peer.id, userName);
        teamMembers[peer.id] = userName;

        conn.on("data", (msg) => handleIncomingMessage(msg, conn));
    });
}

// Send a message to all connected Users
function sendMessage() {
    const message = document.getElementById("messageInput").value;
    if (!connections.length) {
        alert("No peers connected!");
        return;
    }

    let msgObj = { type: "message", name: userName, text: message };
    broadcast(msgObj);
    displayMessage(`You: ${message}`, true);

    document.getElementById("messageInput").value = "";
}

// Display messages in chat
function displayMessage(msg, isSender) {
    let chatBox = document.getElementById("chatBox");
    let messageElement = document.createElement("div");
    messageElement.innerText = msg;
    messageElement.className = `p-3 rounded max-w-xs ${
        isSender ? "bg-orange-500 self-end" : "bg-gray-700"
    }`;
    chatBox.appendChild(messageElement);
}

// Add team members dynamically
function addTeamMember(peerId, name ) {
    if (teamMembers[peerId]) return; 

    let teamList = document.getElementById("teamMembers");
    let member = document.createElement("li");
    member.innerText = name || `User (${peerId})`;
    member.id = peerId;
    member.className = `mb-2 p-2 bg-gray-700 rounded`;
    teamList.appendChild(member);
}
