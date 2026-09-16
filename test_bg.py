from PIL import Image

def has_transparency(img):
    if img.mode == "RGBA":
        extrema = img.getextrema()
        if extrema[3][0] < 255:
            return True
    return False

print(has_transparency(Image.open('attached_assets/Group_1171275379_1789519135748.png')))
