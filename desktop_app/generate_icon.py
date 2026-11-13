#!/usr/bin/env python3
"""
Generate a clean standalone app_icon.ico using pure Python standard library (no PIL required)
"""
import os
import struct

def generate_ico(output_path):
    # Create a 32x32 RGBA icon buffer (dark slate background with an emerald checkmark)
    width, height = 32, 32
    pixels = []

    # Simple checkmark pattern coordinates in 32x32
    # Checkmark coordinates roughly: (9, 16) -> (14, 21) -> (23, 10)
    for y in range(height):
        row = []
        for x in range(width):
            # Background: rounded rect effect
            dx = min(x, width - 1 - x)
            dy = min(y, height - 1 - y)
            is_border = (dx == 0 and dy == 0) or (dx == 0 and dy == 1) or (dx == 1 and dy == 0)

            if is_border:
                row.append((0, 0, 0, 0)) # transparent corners
            else:
                # Checkmark logic (stroke width 2)
                is_check = False
                # First leg: (9, 16) to (14, 21)
                for t in range(7):
                    cx, cy = 9 + t, 16 + t
                    if abs(x - cx) <= 1 and abs(y - cy) <= 1:
                        is_check = True
                # Second leg: (14, 21) to (23, 10)
                for t in range(12):
                    cx, cy = 14 + t, 21 - t
                    if abs(x - cx) <= 1 and abs(y - cy) <= 1:
                        is_check = True

                if is_check:
                    row.append((255, 255, 255, 255)) # Crisp White
                else:
                    row.append((15, 23, 42, 255)) # Dark slate #0f172a
        pixels.append(row)

    # Convert to BMP data inside ICO (BMP 32bpp, bottom-up)
    bmp_header_size = 40
    image_size = width * height * 4
    mask_size = width * height // 8
    total_data_size = bmp_header_size + image_size + mask_size

    # ICO directory header: 6 bytes
    # Reserved: 0 (2 bytes), Type: 1 for icon (2 bytes), Count: 1 image (2 bytes)
    ico_header = struct.pack('<HHH', 0, 1, 1)

    # Directory entry: 16 bytes
    # width, height, colors, reserved, planes, bpp, bytes_in_res, image_offset
    offset = 6 + 16
    entry = struct.pack(
        '<BBBBHHII',
        width,
        height,
        0, # color palette
        0, # reserved
        1, # color planes
        32, # bits per pixel
        total_data_size,
        offset
    )

    # BMP Header (BITMAPINFOHEADER)
    # biSize, biWidth, biHeight (x2 for ICO), biPlanes, biBitCount, biCompression, biSizeImage, biXPelsPerMeter, biYPelsPerMeter, biClrUsed, biClrImportant
    bmp_header = struct.pack(
        '<IIIHHIIIIII',
        40,
        width,
        height * 2, # standard for ICO
        1,
        32,
        0, # BI_RGB
        image_size + mask_size,
        0,
        0,
        0,
        0
    )

    # Pixel data (BGRA, bottom-to-top)
    raw_pixels = bytearray()
    for y in reversed(range(height)):
        for x in range(width):
            r, g, b, a = pixels[y][x]
            raw_pixels.extend([b, g, r, a])

    # AND mask (1 bit per pixel, 0 for opaque)
    raw_mask = bytearray(mask_size)

    with open(output_path, 'wb') as f:
        f.write(ico_header)
        f.write(entry)
        f.write(bmp_header)
        f.write(raw_pixels)
        f.write(raw_mask)

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'app_icon.ico')
    generate_ico(out)
    print("Generated app_icon.ico successfully at", out)
