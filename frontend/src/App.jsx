import { useEffect, useRef, useState } from "react";
import "./App.css";

const BACKEND = "http://localhost:8000";

export default function App() {
  const [demos, setDemos] = useState([]);
  const [demo, setDemo] = useState("");

  const [cameras, setCameras] = useState([]);
  const [length, setLength] = useState(0);
  const [t, setT] = useState(0);

  const [labels, setLabels] = useState([]);

  // Label mode: 1 = good, -1 = bad, 0 unused
  const [labelMode, setLabelMode] = useState(1);

  const [playing, setPlaying] = useState(false);
  const FPS = 10;
  const intervalRef = useRef(null);

  // Load demo list
  useEffect(() => {
    fetch(`${BACKEND}/demos`)
      .then((r) => r.json())
      .then((d) => {
        const sorted = d.demos.sort((a, b) => {
          const na = parseInt(a.replace("demo_", ""));
          const nb = parseInt(b.replace("demo_", ""));
          return na - nb;
        });
        setDemos(sorted);
      });
  }, []);

  // Load metadata when demo changes
  useEffect(() => {
    if (!demo) return;

    fetch(`${BACKEND}/demo/${demo}/length`)
      .then((r) => r.json())
      .then((d) => {
        setLength(d.length);
        setT(0);
      });

    fetch(`${BACKEND}/demo/${demo}/cameras`)
      .then((r) => r.json())
      .then((d) => setCameras(d.cameras));

    fetch(`${BACKEND}/demo/${demo}/labels`)
      .then((r) => r.json())
      .then((d) => setLabels(d.labels));
  }, [demo]);

  // Apply label to a frame
  function applyLabel(idx, mode) {
    if (!demo) return;

    fetch(`${BACKEND}/update_label?demo=${demo}&t=${idx}&label=${mode}`, {
      method: "POST",
    });

    setLabels((prev) => {
      const updated = [...prev];
      updated[idx] = mode;
      return updated;
    });
  }

  // Keep label mode fresh inside interval
  const labelModeRef = useRef(labelMode);
  useEffect(() => {
    labelModeRef.current = labelMode;
  }, [labelMode]);

  // PLAY / PAUSE
  function togglePlay() {
    if (playing) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPlaying(false);
      return;
    }

    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setT((prev) => {
        if (length <= 0) return prev;

        const next = prev + 1;

        if (next >= length) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPlaying(false);
          return prev;
        }

        applyLabel(prev, labelModeRef.current);
        return next;
      });
    }, 1000 / FPS);

    setPlaying(true);
  }

  function handleSliderChange(e) {
    setT(parseInt(e.target.value));
  }

  function jumpToFrame(idx) {
    setT(idx);
  }

  // Clear all labels
  function clearAllLabels() {
    if (!demo) return;

    fetch(`${BACKEND}/clear_labels?demo=${demo}`, { method: "POST" })
      .then(() => {
        setLabels(new Array(length).fill(0));
      });
  }

  return (
    <div className="layout">
      <div className="sidebar">
        <h3>Demo</h3>
        <select value={demo} onChange={(e) => setDemo(e.target.value)}>
          <option value=""></option>
          {demos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <h3>Frame: {t} / {Math.max(0, length - 1)}</h3>
        <input
          type="range"
          min={0}
          max={Math.max(0, length - 1)}
          value={t}
          onChange={handleSliderChange}
        />

        <button onClick={togglePlay}>
          {playing ? "Pause" : "Play"}
        </button>

        <h3>Label Mode</h3>
        <div className="mode-buttons">
          <button
            className={"mode-btn " + (labelMode === 1 ? "active-green" : "")}
            onClick={() => setLabelMode(1)}
          >
            GOOD (1)
          </button>

          <button
            className={"mode-btn " + (labelMode === -1 ? "active-red" : "")}
            onClick={() => setLabelMode(-1)}
          >
            BAD (-1)
          </button>
        </div>

        <button className="clear-btn" onClick={clearAllLabels}>
          CLEAR ALL LABELS (0)
        </button>
      </div>

      {/* 🔥 MULTI-CAMERA VIEW */}
      <div className="viewer-multi">
        {cameras.map((cam) => (
          <div key={cam} className="camera-block">
            <h4>{cam}</h4>
            <img
              className="frame"
              src={`${BACKEND}/frame?demo=${demo}&t=${t}&camera=${cam}`}
              alt={cam}
            />
          </div>
        ))}
      </div>

      {/* 🔥 TIMELINE */}
      <div className="timeline-container">
        {labels.map((lb, idx) => (
          <div
            key={idx}
            className={
              "timeline-cell " +
              (lb === 1 ? "green" : lb === 0 ? "white" : "red")
            }
            onClick={() => jumpToFrame(idx)}
          />
        ))}
      </div>
    </div>
  );
}
