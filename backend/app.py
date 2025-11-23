# ===============================================================
# DexMimic / RoboMimic HDF5 Labeling Backend (per-frame labels)
# ===============================================================

import io
import h5py
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

HDF5_PATH = "/media/hua-hsuan/67125225-ddbb-45ec-94db-aad3db122a1b/columbia/roamlab/rl_web/datasets/two_arm_threading.hdf5"  # update this
h5 = h5py.File(HDF5_PATH, "a")

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_demo_group(demo):
    if demo not in h5["data"]:
        raise HTTPException(404, f"No demo {demo}")
    return h5["data"][demo]


# ===============================================================
# BASIC METADATA
# ===============================================================

@app.get("/demos")
def list_demos():
    return {"demos": sorted(list(h5["data"].keys()))}

@app.get("/demo/{demo}/length")
def get_length(demo: str):
    d = get_demo_group(demo)
    T = len(d["actions"])
    return {"length": int(T)}

@app.get("/demo/{demo}/cameras")
def get_camera_list(demo: str):
    obs = get_demo_group(demo)["obs"]
    cams = []
    for k, v in obs.items():
        if isinstance(v, h5py.Dataset) and v.ndim == 4 and v.shape[-1] == 3:
            cams.append(k)
    return {"cameras": cams}


# ===============================================================
# FRAME FETCHING
# ===============================================================

@app.get("/frame")
def get_frame(demo: str, t: int, camera: str):
    d = get_demo_group(demo)
    obs = d["obs"]
    if camera not in obs:
        raise HTTPException(404, "Camera not found")

    frame = obs[camera][t]
    pil = Image.fromarray(frame)
    buf = io.BytesIO()
    pil.save(buf, format="JPEG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/jpeg")


# ===============================================================
# PER-FRAME LABELING
# ===============================================================

@app.get("/demo/{demo}/labels")
def get_labels(demo: str):
    d = get_demo_group(demo)

    T = len(d["actions"])

    if "labels" not in d:
        # Initialize with ALL ZEROS (bad)
        labels = np.zeros((T,), dtype=np.int8)
        d.create_dataset("labels", data=labels)
        h5.flush()
        return {"labels": labels.tolist()}

    labels = d["labels"][()]

    # Fix mismatch
    if len(labels) != T:
        labels = np.zeros((T,), dtype=np.int8)
        del d["labels"]
        d.create_dataset("labels", data=labels)
        h5.flush()

    return {"labels": labels.tolist()}


@app.post("/update_label")
def update_label(demo: str, t: int, label: int):
    """
    Update a single frame's label:
    -1 = unlabeled (RED)
     0 = bad (WHITE)
     1 = good (GREEN)
    """
    if label not in [-1, 0, 1]:
        raise HTTPException(400, "Label must be -1, 0, or 1")

    d = get_demo_group(demo)
    T = len(d["actions"])

    if t < 0 or t >= T:
        raise HTTPException(400, "Invalid timestep")

    # Initialize if missing
    if "labels" not in d:
        labels = np.zeros((T,), dtype=np.int8)
        d.create_dataset("labels", data=labels)

    labels = d["labels"][()]
    labels[t] = label

    del d["labels"]
    d.create_dataset("labels", data=labels)
    h5.flush()

    return {"status": "ok", "demo": demo, "t": t, "label": label}

@app.post("/clear_labels")
def clear_labels(demo: str):
    
    d = get_demo_group(demo)
    length = len(d["actions"])
    labels = np.zeros((length,), dtype=np.int8)
    if "labels" in d:
        del d["labels"]
    d.create_dataset("labels", data=labels)
    h5.flush()
    # Save to HDF5
    # ds = h5py.File(DATA[demo]["path"], "r+")
    # if "labels" in ds:
    #     ds["labels"][...] = labels
    # else:
    #     ds.create_dataset("labels", data=labels)
    # ds.close()

    return {"status": "ok"}