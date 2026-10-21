// Renders the placeholder App Store icon from code so its provenance is clear.
// Usage: swift scripts/generate-app-icon.swift "AI Petverse/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let side = 1024
let cell = 48

// A 16 x 14 pixel-art pet face. Each character maps to a palette entry below.
let sprite = [
    "..OO........OO..",
    ".OPOO......OOPO.",
    ".OPPOO....OOPPO.",
    ".OOOOOOOOOOOOOOD",
    "OOOOOOOOOOOOOOOD",
    "OOOHKOOOOOOHKOOD",
    "OOOKKOOOOOOKKOOD",
    "OOWWWOOOOOOWWWOD",
    "OWWWWWWKKWWWWWWD",
    "OWWWWWWKKWWWWWWD",
    ".WWWWWKWWKWWWWD.",
    ".WWWWWWPPWWWWWD.",
    "..WWWWWPPWWWWD..",
    "...WWWWWWWWWD...",
]

let palette: [Character: (CGFloat, CGFloat, CGFloat)] = [
    "O": (0.96, 0.62, 0.04), // coat, matches PetStyle.sunny accent F59E0B
    "D": (0.78, 0.45, 0.10), // coat shade on the right edge for a voxel feel
    "W": (1.00, 0.96, 0.88), // cream muzzle
    "K": (0.10, 0.13, 0.23), // ink, matches PetverseTheme.ink 19223A
    "H": (1.00, 1.00, 1.00), // eye highlight
    "P": (1.00, 0.49, 0.42), // coral, matches PetverseTheme.coral FF7D6B
]

func rgb(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat) -> CGColor {
    CGColor(srgbRed: r, green: g, blue: b, alpha: 1)
}

guard CommandLine.arguments.count == 2 else {
    FileHandle.standardError.write(Data("usage: generate-app-icon.swift <output.png>\n".utf8))
    exit(64)
}

// App Store icons must be opaque, so the context has no alpha channel.
guard let context = CGContext(
    data: nil,
    width: side,
    height: side,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else { exit(1) }

// Purple-to-blue brand gradient (PetverseTheme.purple -> electricBlue).
let gradient = CGGradient(
    colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
    colors: [rgb(0.55, 0.36, 0.96), rgb(0.27, 0.84, 1.00)] as CFArray,
    locations: [0, 1]
)!
context.drawLinearGradient(gradient, start: CGPoint(x: 0, y: CGFloat(side)), end: CGPoint(x: 0, y: 0), options: [])

let spriteWidth = sprite[0].count * cell
let spriteHeight = sprite.count * cell
let originX = (side - spriteWidth) / 2
let originY = (side - spriteHeight) / 2 + 40

// Soft ground shadow under the face.
context.setFillColor(CGColor(srgbRed: 0.10, green: 0.13, blue: 0.23, alpha: 0.18))
context.fillEllipse(in: CGRect(x: originX + 48, y: originY - 120, width: spriteWidth - 96, height: 72))

context.setShouldAntialias(false)
for (row, line) in sprite.enumerated() {
    for (column, key) in line.enumerated() {
        guard let color = palette[key] else { continue }
        context.setFillColor(rgb(color.0, color.1, color.2))
        // Core Graphics has a bottom-left origin; sprite rows are listed top-down.
        let y = originY + (sprite.count - 1 - row) * cell
        context.fill(CGRect(x: originX + column * cell, y: y, width: cell, height: cell))
    }
}

guard let image = context.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
        URL(fileURLWithPath: CommandLine.arguments[1]) as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
      ) else { exit(1) }
CGImageDestinationAddImage(destination, image, nil)
exit(CGImageDestinationFinalize(destination) ? 0 : 1)
