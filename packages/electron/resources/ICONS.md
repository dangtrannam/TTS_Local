# App Icon Requirements

This directory should contain the application icons for different platforms.

## Required Icon Files

### macOS
- **icon.icns** - macOS app icon
  - Multi-resolution ICNS file containing sizes: 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024
  - Create from a 1024x1024 PNG using: `iconutil -c icns icon.iconset`

### Windows
- **icon.ico** - Windows app icon
  - Multi-resolution ICO file containing sizes: 16x16, 32x32, 48x48, 256x256
  - Create using ImageMagick or online tools from source PNG

### Linux
- **icon.png** - Linux app icon
  - Single PNG file, recommended size: 512x512 or 1024x1024

## Creating Icons

### From Source PNG (1024x1024)

1. **Create icon.iconset directory** (macOS)
   ```bash
   mkdir icon.iconset
   # Generate all required sizes
   sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   # Generate ICNS
   iconutil -c icns icon.iconset
   ```

2. **Create icon.ico** (Windows)
   ```bash
   # Using ImageMagick
   convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
   ```

3. **Create icon.png** (Linux)
   ```bash
   # Just copy or resize the source
   cp icon.png resources/icon.png
   # Or resize to 512x512
   sips -z 512 512 icon.png --out resources/icon.png
   ```

## Design Guidelines

- Use a simple, recognizable design that scales well
- Ensure good contrast for both light and dark backgrounds
- Avoid text in icons (doesn't scale well at small sizes)
- Consider rounded corners for macOS style (handled automatically)
- Test icons at all sizes to ensure clarity

## Placeholder Icons

For development, you can use placeholder icons:
- Generate generic icons using online tools
- Use the Electron default icon temporarily
- Create simple geometric shapes as placeholders

## Integration

Icons are referenced in `electron-builder.yml`:
```yaml
mac:
  icon: resources/icon.icns

win:
  icon: resources/icon.ico

linux:
  icon: resources/icon.png
```

Make sure to place the generated icon files in this directory before building.
