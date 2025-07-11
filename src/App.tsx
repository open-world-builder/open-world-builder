import {
  DbConnection,
  ErrorContext,
  EventContext,
  Message,
  User,
} from "./module_bindings";
import { Identity } from "@clockworklabs/spacetimedb-sdk";

import React, { useEffect, useState, useRef } from "react";
import "./App.css";

import { Multiplayer } from "./multiplayer/Multiplayer";
import { Streamer } from "./streamer/Streamer";

export type PrettyMessage = {
  senderName: string;
  text: string;
};

function useMessages(conn: DbConnection | null): Message[] {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!conn) return;
    const onInsert = (_ctx: EventContext, message: Message) => {
      setMessages((prev) => [...prev, message]);
    };
    conn.db.message.onInsert(onInsert);

    const onDelete = (_ctx: EventContext, message: Message) => {
      setMessages((prev) =>
        prev.filter(
          (m) =>
            m.text !== message.text &&
            m.sent !== message.sent &&
            m.sender !== message.sender
        )
      );
    };
    conn.db.message.onDelete(onDelete);

    return () => {
      conn.db.message.removeOnInsert(onInsert);
      conn.db.message.removeOnDelete(onDelete);
    };
  }, [conn]);

  return messages;
}

function useUsers(conn: DbConnection | null): Map<string, User> {
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    if (!conn) return;
    const onInsert = (_ctx: EventContext, user: User) => {
      setUsers((prev) => new Map(prev.set(user.identity.toHexString(), user)));
    };
    conn.db.user.onInsert(onInsert);

    const onUpdate = (_ctx: EventContext, oldUser: User, newUser: User) => {
      setUsers((prev) => {
        prev.delete(oldUser.identity.toHexString());
        return new Map(prev.set(newUser.identity.toHexString(), newUser));
      });
    };
    conn.db.user.onUpdate(onUpdate);

    const onDelete = (_ctx: EventContext, user: User) => {
      setUsers((prev) => {
        prev.delete(user.identity.toHexString());
        return new Map(prev);
      });
    };
    conn.db.user.onDelete(onDelete);

    return () => {
      conn.db.user.removeOnInsert(onInsert);
      conn.db.user.removeOnUpdate(onUpdate);
      conn.db.user.removeOnDelete(onDelete);
    };
  }, [conn]);

  return users;
}

function App() {
  const [newName, setNewName] = useState("");
  const [settingName, setSettingName] = useState(false);
  // const [systemMessage, setSystemMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const [connected, setConnected] = useState<boolean>(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [conn, setConn] = useState<DbConnection | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const messages = useMessages(conn);
  const users = useUsers(conn);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get("server");
  window.CHANNEL_ID = channelId || "0"; // Default to 0, no multiplayer
  console.log("CHANNEL_ID", window.CHANNEL_ID);

  // Add this line to check URL parameters
  const shouldShowMultiplayer =
    new URLSearchParams(window.location.search)
      .get("multiplayer")
      ?.toLowerCase() !== "false";

  if (!shouldShowMultiplayer) {
    return <div className="App" style={{ pointerEvents: "none" }}></div>;
  }

  if (window.CHANNEL_ID === "0") {
    return <div className="App" style={{ pointerEvents: "none" }}>
      <h1 id="loading" style={{ marginLeft: "14px", marginTop: "5px", color: "white" }}>Loading...</h1>
      <Streamer conn={null} />
    </div>;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const subscribeToQueries = (conn: DbConnection, queries: string[]) => {
      let count = 0;
      for (const query of queries) {
        conn
          ?.subscriptionBuilder()
          .onApplied(() => {
            count++;
            if (count === queries.length) {
              console.log("SDK client cache initialized.");
            }
          })
          .subscribe(query);
      }
    };

    const onConnect = (
      conn: DbConnection,
      identity: Identity,
      token: string
    ) => {
      setIdentity(identity);
      setConnected(true);

      localStorage.setItem("auth_token", token);
      console.log(
        "Connected to SpacetimeDB with identity:",
        identity.toHexString()
      );
      conn.reducers.onSendMessage(() => {
        console.log("Message sent.");
      });

      subscribeToQueries(conn, ["SELECT * FROM message", "SELECT * FROM user"]);
    };

    const onDisconnect = () => {
      console.log("Disconnected from SpacetimeDB");
      setConnected(false);
    };

    const onConnectError = (_ctx: ErrorContext, err: Error) => {
      console.log("Error connecting to SpacetimeDB:", err);
    };

    setConn(
      DbConnection.builder()
        .withUri(
          import.meta.env.DEV
            ? "ws://localhost:3000"
            : "wss://maincloud.spacetimedb.com"
        )
        .withModuleName("open-web-rpg-server")
        .withToken(localStorage.getItem("auth_token") || "")
        .onConnect(onConnect)
        .onDisconnect(onDisconnect)
        .onConnectError(onConnectError)
        .build()
    );
  }, []);

  const prettyMessages: PrettyMessage[] = messages
    .sort((a, b) => (a.sent > b.sent ? 1 : -1))
    .map((message) => ({
      senderName:
        users.get(message.sender.toHexString())?.name ||
        message.sender.toHexString().substring(0, 8),
      text: message.text,
    }));

  if (!conn || !connected || !identity) {
    return (
      <div className="App" style={{ pointerEvents: "none" }}>
        <h1 style={{ marginLeft: "14px", marginTop: "5px" }}>Connecting...</h1>
      </div>
    );
  }

  const name =
    users.get(identity?.toHexString())?.name ||
    identity?.toHexString().substring(0, 8) ||
    "unknown";

  const onSubmitNewName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSettingName(false);
    conn.reducers.setName(newName);
  };

  const onMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewMessage("");
    conn.reducers.sendMessage(newMessage);
  };
  return (
    <div className="App" style={{ pointerEvents: "none" }}>
      <Multiplayer conn={conn} identity={identity?.toHexString() || null} />
      <Streamer conn={conn} />
      <button
        className="chat-toggle-button"
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          padding: "10px",
          // backgroundColor: "var(--theme-color)",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          border: "none",
        }}
      >
        {isChatOpen ? "✕" : "💬"}
      </button>
      {isChatOpen && (
        <>
          <div className="profile">
            <h1>Profile</h1>
            {!settingName ? (
              <>
                <p>{name}</p>
                <button
                  onClick={() => {
                    setSettingName(true);
                    setNewName(name);
                  }}
                >
                  Edit Name
                </button>
              </>
            ) : (
              <form onSubmit={onSubmitNewName}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Escape") {
                      setSettingName(false);
                    }
                  }}
                />
                <button type="submit">Submit</button>
              </form>
            )}
          </div>

          <div className="floating-messages">
            <div className="floating-messages-header">Messages</div>
            <div className="floating-messages-content">
              {prettyMessages.length < 1 ? (
                <p>No messages</p>
              ) : (
                prettyMessages.map((message, key) => (
                  <div key={key} className="message-item">
                    <div className="message-sender">
                      {message.senderName + ":"}&nbsp;
                    </div>
                    <div className="message-text">{message.text}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {/*     <div className="message">
        <h1>Messages</h1>
        {prettyMessages.length < 1 && <p>No messages</p>}
        <div>
          {prettyMessages.map((message, key) => (
            <div key={key}>
              <p>
                <b>{message.senderName}</b>
              </p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </div> */}
          {/* <div className="system" style={{ whiteSpace: "pre-wrap" }}>
        <h1>System</h1>
        <div>
          <p>{systemMessage}</p>
        </div>
      </div> */}
          <div
            className="new-message"
            style={{ position: "absolute", bottom: 0 }}
          >
            <form onSubmit={onMessageSubmit}>
              <span className="message-prefix">{name}: </span>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim()) {
                      onMessageSubmit(e as any);
                    }
                  }
                }}
                rows={1}
                placeholder="Type your message..."
              ></textarea>
              <button type="submit">Send</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
