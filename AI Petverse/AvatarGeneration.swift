import Foundation
import CoreGraphics
import ImageIO
import UIKit
import UniformTypeIdentifiers

struct AvatarGenerationRequest: Sendable {
    let sourceImageData: Data
    let style: PetStyle
}

struct GeneratedAvatar: Sendable {
    let sourceImageData: Data
    let avatarImageData: Data

    init(sourceImageData: Data, avatarImageData: Data? = nil) {
        self.sourceImageData = sourceImageData
        self.avatarImageData = avatarImageData ?? sourceImageData
    }
}

enum AvatarGenerationError: LocalizedError, Equatable {
    case emptySourceImage
    case invalidSourceImage
    case providerUnavailable

    var errorDescription: String? {
        switch self {
        case .emptySourceImage:
            return "The selected photo is empty."
        case .invalidSourceImage:
            return "The selected photo could not be decoded."
        case .providerUnavailable:
            return "The avatar preview provider is unavailable."
        }
    }
}

protocol AvatarGenerationService: Sendable {
    func generate(request: AvatarGenerationRequest) async throws -> GeneratedAvatar
}

struct LocalPreviewAvatarGenerationService: AvatarGenerationService {
    var delay: Duration = .milliseconds(650)

    func generate(request: AvatarGenerationRequest) async throws -> GeneratedAvatar {
        guard !request.sourceImageData.isEmpty else {
            throw AvatarGenerationError.emptySourceImage
        }
        try await Task.sleep(for: delay)
        try Task.checkCancellation()
        let sourceImageData = request.sourceImageData
        let style = request.style
        let avatarImageData = try await Task.detached(priority: .userInitiated) {
            try Task.checkCancellation()
            return try PixelAvatarRenderer.render(sourceImageData: sourceImageData, style: style)
        }.value
        try Task.checkCancellation()
        return GeneratedAvatar(sourceImageData: sourceImageData, avatarImageData: avatarImageData)
    }
}

/// Small, deterministic on-device renderer used until a remote AI provider is
/// selected. It intentionally produces a pixel portrait, rather than claiming
/// to reconstruct a 3D pet or to be an AI model.
enum PixelAvatarRenderer {
    static let workingSide = 48
    static let outputSide = 576

    static func render(sourceImageData: Data, style: PetStyle) throws -> Data {
        guard !sourceImageData.isEmpty,
              let source = CGImageSourceCreateWithData(sourceImageData as CFData, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(
                source,
                0,
                [
                    kCGImageSourceCreateThumbnailFromImageAlways: true,
                    kCGImageSourceCreateThumbnailWithTransform: true,
                    kCGImageSourceThumbnailMaxPixelSize: 1024
                ] as CFDictionary
              ) else {
            throw AvatarGenerationError.invalidSourceImage
        }

        let side = min(image.width, image.height)
        guard side > 0,
              let cropped = image.cropping(to: CGRect(
                x: CGFloat(image.width - side) / 2,
                y: CGFloat(image.height - side) / 2,
                width: CGFloat(side),
                height: CGFloat(side)
              )) else {
            throw AvatarGenerationError.invalidSourceImage
        }

        let small = try makePixelImage(from: cropped, style: style)
        let output = try upscale(small)
        let outputData = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(
            outputData,
            UTType.png.identifier as CFString,
            1,
            nil
        ) else {
            throw AvatarGenerationError.providerUnavailable
        }
        CGImageDestinationAddImage(destination, output, nil)
        guard CGImageDestinationFinalize(destination) else {
            throw AvatarGenerationError.providerUnavailable
        }
        return outputData as Data
    }

    private static func makePixelImage(from source: CGImage, style: PetStyle) throws -> CGImage {
        let width = workingSide
        let height = workingSide
        var pixels = [UInt8](repeating: 0, count: width * height * 4)
        guard let image = pixels.withUnsafeMutableBytes({ rawBuffer -> CGImage? in
            guard let baseAddress = rawBuffer.baseAddress,
                  let context = CGContext(
                      data: baseAddress,
                      width: width,
                      height: height,
                      bitsPerComponent: 8,
                      bytesPerRow: width * 4,
                      space: CGColorSpaceCreateDeviceRGB(),
                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
                  ) else {
                return nil
            }
            context.interpolationQuality = .none
            context.draw(source, in: CGRect(x: 0, y: 0, width: width, height: height))

            let bytes = rawBuffer.bindMemory(to: UInt8.self)
            for index in stride(from: 0, to: bytes.count, by: 4) {
                let transformed = transform(
                    red: bytes[index],
                    green: bytes[index + 1],
                    blue: bytes[index + 2],
                    style: style
                )
                bytes[index] = transformed.red
                bytes[index + 1] = transformed.green
                bytes[index + 2] = transformed.blue
            }
            return context.makeImage()
        }) else {
            throw AvatarGenerationError.providerUnavailable
        }
        return image
    }

    private static func upscale(_ source: CGImage) throws -> CGImage {
        var pixels = [UInt8](repeating: 0, count: outputSide * outputSide * 4)
        guard let image = pixels.withUnsafeMutableBytes({ rawBuffer -> CGImage? in
            guard let baseAddress = rawBuffer.baseAddress,
                  let context = CGContext(
                      data: baseAddress,
                      width: outputSide,
                      height: outputSide,
                      bitsPerComponent: 8,
                      bytesPerRow: outputSide * 4,
                      space: CGColorSpaceCreateDeviceRGB(),
                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
                  ) else {
                return nil
            }
            context.interpolationQuality = .none
            context.draw(source, in: CGRect(x: 0, y: 0, width: outputSide, height: outputSide))
            return context.makeImage()
        }) else {
            throw AvatarGenerationError.providerUnavailable
        }
        return image
    }

    private static func transform(red: UInt8, green: UInt8, blue: UInt8, style: PetStyle) -> (red: UInt8, green: UInt8, blue: UInt8) {
        // Posterizing first creates clear pixel clusters and keeps file sizes small.
        let r = Double((red / 32) * 32)
        let g = Double((green / 32) * 32)
        let b = Double((blue / 32) * 32)
        let adjusted: (Double, Double, Double)
        switch style {
        case .sunny:
            adjusted = (r * 1.08 + 10, g * 0.96 + 8, b * 0.78)
        case .midnight:
            adjusted = (r * 0.72 + 16, g * 0.76 + 8, b * 1.16 + 22)
        case .candy:
            adjusted = (r * 1.12 + 18, g * 0.76 + 12, b * 1.02 + 20)
        }
        return (
            UInt8(max(0, min(255, adjusted.0))),
            UInt8(max(0, min(255, adjusted.1))),
            UInt8(max(0, min(255, adjusted.2)))
        )
    }
}
