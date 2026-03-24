
import pytest
from services.vision_service import validate_image, detect_scan_type, get_image_info
import io
from PIL import Image

def test_validate_image_valid():
    file_bytes = b"fake-image-bytes"
    content_type = "image/jpeg"
    is_valid, error = validate_image(file_bytes, content_type)
    assert is_valid == True
    assert error == ""

def test_validate_image_invalid_type():
    file_bytes = b"fake-image-bytes"
    content_type = "application/pdf"
    is_valid, error = validate_image(file_bytes, content_type)
    assert is_valid == False
    assert "Unsupported file type" in error

def test_validate_image_too_large():
    file_bytes = b"0" * (11 * 1024 * 1024) # 11MB
    content_type = "image/png"
    is_valid, error = validate_image(file_bytes, content_type)
    assert is_valid == False
    assert "too large" in error

def test_detect_scan_type_xray():
    assert detect_scan_type("patient_xray_01.png") == "X-Ray"
    assert detect_scan_type("CHEST-X-RAY.jpg") == "X-Ray"

def test_detect_scan_type_mri():
    assert detect_scan_type("BRAIN_MRI_SCAN.png") == "MRI"

def test_detect_scan_type_general():
    assert detect_scan_type("profile_pic.jpg") == "General Medical Scan"

def test_get_image_info():
    # Create a small dummy image in memory
    img = Image.new('RGB', (100, 200), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()
    
    info = get_image_info(img_bytes)
    assert info['width'] == 100
    assert info['height'] == 200
    assert info['format'] == 'PNG'
