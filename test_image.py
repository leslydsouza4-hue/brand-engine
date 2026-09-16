from PIL import Image

img = Image.open('attached_assets/Group_1171275379_1789519135748.png')
print(f"Size: {img.size}")
rgba = img.convert('RGBA')

# Check pixel at 100, 600 (inside the mask)
print(f"Pixel at 100, 600: {rgba.getpixel((100, 600))}")
print(f"Pixel at 500, 800: {rgba.getpixel((500, 800))}")

