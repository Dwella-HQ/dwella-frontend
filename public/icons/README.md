# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels

## Generating Icons

You can generate these icons from your logo (`src/assets/logo.png`) using online tools like:

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
2. **RealFaviconGenerator**: https://realfavicongenerator.net/
3. **Favicon.io**: https://favicon.io/

Or use a command-line tool:

```bash
# Using ImageMagick (if installed)
convert src/assets/logo.png -resize 512x512 public/icons/icon-512x512.png
convert src/assets/logo.png -resize 384x384 public/icons/icon-384x384.png
convert src/assets/logo.png -resize 192x192 public/icons/icon-192x192.png
convert src/assets/logo.png -resize 152x152 public/icons/icon-152x152.png
convert src/assets/logo.png -resize 144x144 public/icons/icon-144x144.png
convert src/assets/logo.png -resize 128x128 public/icons/icon-128x128.png
convert src/assets/logo.png -resize 96x96 public/icons/icon-96x96.png
convert src/assets/logo.png -resize 72x72 public/icons/icon-72x72.png
```

**Note**: Make sure your icons have a transparent or solid background and are optimized for display on various devices. The 192x192 and 512x512 sizes are the most important for PWA installation.



