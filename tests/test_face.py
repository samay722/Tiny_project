import http.client

with open('backend/temp_face.jpg', 'rb') as f:
    data = f.read()

boundary = 'boundary123'
body = (
    b'--' + boundary.encode() + b'\r\n'
    b'Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n'
    b'Content-Type: image/jpeg\r\n\r\n'
    + data +
    b'\r\n--' + boundary.encode() + b'--\r\n'
)

conn = http.client.HTTPConnection('127.0.0.1', 5000)
conn.request('POST', '/analyze/face', body, {
    'Content-Type': 'multipart/form-data; boundary=' + boundary
})
res = conn.getresponse()
print('Face API Response:', res.read().decode())
