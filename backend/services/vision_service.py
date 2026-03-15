import io
from PIL import Image

def validate_image(file_bytes: bytes, content_type: str) -> tuple[bool, str]:
    """
    Checks if the uploaded file is a valid medical image format and within size limits.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if content_type not in allowed_types:
        return False, f"Unsupported file type: {content_type}. Use JPEG, PNG, or WebP."
    
    if len(file_bytes) > 10 * 1024 * 1024: # 10MB limit
        return False, "Image file is too large (max 10MB)."
    
    return True, ""

def preprocess_image(file_bytes: bytes, content_type: str) -> tuple[bytes, str]:
    """
    Resizes or optimizes the image for AI processing.
    """
    img = Image.open(io.BytesIO(file_bytes))
    
    # Example optimization: Resize if too large
    max_size = (1024, 1024)
    if img.width > max_size[0] or img.height > max_size[1]:
        img.thumbnail(max_size)
    
    output = io.BytesIO()
    img.save(output, format="JPEG", quality=85)
    return output.getvalue(), "image/jpeg"

def get_image_info(file_bytes: bytes) -> dict:
    """
    Extracts basic metadata like dimensions.
    """
    img = Image.open(io.BytesIO(file_bytes))
    return {
        "width": img.width,
        "height": img.height,
        "format": img.format
    }

def detect_scan_type(filename: str) -> str:
    """
    Simple heuristic to guess scan type from filename.
    """
    filename = filename.lower()
    if "xray" in filename or "x-ray" in filename:
        return "X-Ray"
    if "mri" in filename:
        return "MRI"
    if "ct" in filename or "catscan" in filename:
        return "CT Scan"
    
    return "General Medical Scan"