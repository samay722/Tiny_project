import requests
import time

try:
    with open('backend/temp_face.jpg', 'rb') as f:
        start = time.time()
        r = requests.post('http://127.0.0.1:5001/analyze/face', files={'image': f})
        end = time.time()
        print(f"Request took {end - start:.2f} seconds")
        print(r.json())
except Exception as e:
    print(f"Error: {e}")
