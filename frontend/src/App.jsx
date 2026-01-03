import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:3000/api";

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    axios.post(`${API}/session`).then(res => {
      setSessionId(res.data.data.sessionId);
    });
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (err) {
      alert("Camera permission denied.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      const f = new File([blob], "camera.jpg", { type: "image/jpeg" });
      setFile(f);
      stopCamera();
    }, "image/jpeg");
  };

const uploadImage = async () => {
  if (!file) return;

  const fd = new FormData();
  fd.append("image", file);
  fd.append("sessionId", sessionId);

  const res = await axios.post(`${API}/item`, fd);

  const saved = await axios.get(`${API}/item/${res.data.data.itemId}`);

  setItems(prev => [saved.data.data, ...prev]);
  setActiveItem(saved.data.data);
  setMessages([]);
  setFile(null);
};


  const sendMessage = async () => {
    if (!input.trim() || !activeItem) return;

    try {
      const res = await axios.post(`${API}/chat`, {
        itemId: activeItem.itemId || activeItem._id,
        sessionId,
        message: input
      });

      const msg = res.data?.data?.message;

      if (!msg || !msg.role || !msg.content) {
        console.warn("Invalid chat response", res.data);
        return;
      }

      setMessages(prev => [
        ...prev,
        { role: "user", content: input },
        msg
      ]);

      setInput("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Chat failed");
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Products</h2>

        <input type="file" onChange={e => setFile(e.target.files[0])} />

        {!cameraOn && <button onClick={startCamera}>📷 Open Camera</button>}
        {cameraOn && <button onClick={capturePhoto}>Capture</button>}
        {cameraOn && <button onClick={stopCamera}>Close Camera</button>}

        <button onClick={uploadImage} disabled={!file}>Upload</button>

        {items.map(item => (
          <div
            key={item.itemId || item._id}
            className={`item ${(activeItem?.itemId || activeItem?._id) === (item.itemId || item._id) ? "active" : ""}`}
            onClick={() => {
              setActiveItem(item);
              setMessages([]);
            }}
          >
            {item.displayName || "Uploaded Product"}

          </div>
        ))}
      </aside>

      <main className="chat">
        {cameraOn && (
          <div className="camera">
            <video ref={videoRef} autoPlay playsInline />
            <canvas ref={canvasRef} hidden />
          </div>
        )}

        {activeItem ? (
          <>
            <div className="messages">
              {messages
                .filter(m => m && m.role && m.content)
                .map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    {m.content}
                  </div>
                ))}
            </div>

            <div className="input-box">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about this product..."
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="empty">Select or upload a product to chat</div>
        )}
      </main>
    </div>
  );
}
