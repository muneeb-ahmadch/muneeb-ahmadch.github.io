"""Embed texts with BAAI/bge-small-en-v1.5 (CLS pooling, L2-normalised), matching Workers AI with pooling="cls".
Reads a JSON list of strings on stdin, writes raw little-endian float32 bytes to stdout."""
import json, sys
import numpy as np
from sentence_transformers import SentenceTransformer

texts = json.load(sys.stdin)
model = SentenceTransformer("BAAI/bge-small-en-v1.5", device="cpu")
vecs = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
sys.stdout.buffer.write(np.asarray(vecs, dtype="<f4").tobytes())
