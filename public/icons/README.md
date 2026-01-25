# PWA Icons

This folder contains PWA icons for TridentFans.

## Required Icons

The following icon sizes are needed:

| Size | Filename | Purpose |
|------|----------|---------|
| 72x72 | icon-72x72.png | Android home screen |
| 96x96 | icon-96x96.png | Android shortcuts |
| 128x128 | icon-128x128.png | Chrome Web Store |
| 144x144 | icon-144x144.png | Windows tile |
| 152x152 | icon-152x152.png | iPad, Apple touch icon |
| 192x192 | icon-192x192.png | Android home screen (large) |
| 384x384 | icon-384x384.png | Splash screen |
| 512x512 | icon-512x512.png | Install prompt, splash screen |

## Generate Icons

You can generate all icon sizes from the base SVG using this command:

```bash
# Using sharp-cli
npx sharp -i ../icon.svg -o icon-72x72.png resize 72 72
npx sharp -i ../icon.svg -o icon-96x96.png resize 96 96
npx sharp -i ../icon.svg -o icon-128x128.png resize 128 128
npx sharp -i ../icon.svg -o icon-144x144.png resize 144 144
npx sharp -i ../icon.svg -o icon-152x152.png resize 152 152
npx sharp -i ../icon.svg -o icon-192x192.png resize 192 192
npx sharp -i ../icon.svg -o icon-384x384.png resize 384 384
npx sharp -i ../icon.svg -o icon-512x512.png resize 512 512

# Or using ImageMagick
convert ../icon.svg -resize 72x72 icon-72x72.png
convert ../icon.svg -resize 96x96 icon-96x96.png
convert ../icon.svg -resize 128x128 icon-128x128.png
convert ../icon.svg -resize 144x144 icon-144x144.png
convert ../icon.svg -resize 152x152 icon-152x152.png
convert ../icon.svg -resize 192x192 icon-192x192.png
convert ../icon.svg -resize 384x384 icon-384x384.png
convert ../icon.svg -resize 512x512 icon-512x512.png
```

## Design Notes

- **Colors**: Mariners Teal (#005c5c) and Navy (#0c2c56)
- **Background**: Navy background recommended
- **Maskable**: Ensure icon has safe zone padding for maskable icons
