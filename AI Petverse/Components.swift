import SwiftUI
import UIKit

struct BrandMark: View {
    var body: some View {
        HStack(spacing: 9) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous).fill(PetverseTheme.ink)
                Text("✦").font(.system(size: 17, weight: .bold)).foregroundStyle(.white)
            }
            .frame(width: 32, height: 32)
            Text("petverse")
                .font(.system(size: 19, weight: .bold, design: .rounded))
                .foregroundStyle(PetverseTheme.ink)
        }
    }
}

struct PrimaryButton: View {
    let title: String
    var systemImage: String? = nil
    var tint: Color = PetverseTheme.ink
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Text(title).font(.system(size: 16, weight: .semibold, design: .rounded))
                if let systemImage {
                    Image(systemName: systemImage).font(.system(size: 14, weight: .bold))
                }
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(tint, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct SecondaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(PetverseTheme.ink)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(PetverseTheme.ink.opacity(0.1)))
        }
        .buttonStyle(.plain)
    }
}

struct PetAvatar: View {
    let style: PetStyle
    var imageData: Data? = nil
    var appearance = PetAppearance()
    var size: CGFloat = 160

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.18, style: .continuous)
                .fill(Color(hex: style.accentHex).opacity(0.22))
                .frame(width: size, height: size)
                .overlay(alignment: .topLeading) {
                    RoundedRectangle(cornerRadius: 5).fill(PetverseTheme.electricBlue.opacity(0.5)).frame(width: size * 0.2, height: size * 0.06).offset(x: size * 0.12, y: size * 0.1)
                }
            RoundedRectangle(cornerRadius: size * 0.15, style: .continuous)
                .fill(.white.opacity(0.92))
                .frame(width: size * 0.82, height: size * 0.82)
                .shadow(color: PetverseTheme.ink.opacity(0.12), radius: 0, x: 7, y: 7)
            LowPolyPetIcon(style: style, appearance: appearance)
                .frame(width: size * 0.66, height: size * 0.66)
                .overlay(RoundedRectangle(cornerRadius: size * 0.13).stroke(PetverseTheme.hotPink.opacity(0.26), lineWidth: 2))
            if let accessory = appearance.accessorySymbol {
                Text(accessory)
                    .font(.system(size: size * 0.19))
                    .padding(5)
                    .background(.white.opacity(0.88), in: Circle())
                    .offset(x: size * 0.29, y: -size * 0.29)
            }
        }
    }
}

struct LowPolyPetIcon: View {
    let style: PetStyle
    let appearance: PetAppearance

    var body: some View {
        Canvas { context, canvasSize in
            let w = canvasSize.width
            let h = canvasSize.height
            let coat = Color(hex: appearance.colorHex)
            let light = coat.opacity(0.92)
            let mid = coat.opacity(0.72)
            let shade = coat.opacity(0.48)
            let outline = Color(hex: "19223A").opacity(0.24)

            func polygon(_ points: [CGPoint], _ fill: Color) {
                var path = Path()
                guard let first = points.first else { return }
                path.move(to: first)
                for point in points.dropFirst() { path.addLine(to: point) }
                path.closeSubpath()
                context.fill(path, with: .color(fill))
            }

            // Monument-Valley-like facets: every surface is a clean plane.
            polygon([
                CGPoint(x: w * 0.23, y: h * 0.67), CGPoint(x: w * 0.38, y: h * 0.56),
                CGPoint(x: w * 0.70, y: h * 0.57), CGPoint(x: w * 0.84, y: h * 0.70),
                CGPoint(x: w * 0.73, y: h * 0.91), CGPoint(x: w * 0.31, y: h * 0.91)
            ], mid)
            polygon([
                CGPoint(x: w * 0.23, y: h * 0.67), CGPoint(x: w * 0.38, y: h * 0.56),
                CGPoint(x: w * 0.48, y: h * 0.72), CGPoint(x: w * 0.31, y: h * 0.91)
            ], shade)
            polygon([
                CGPoint(x: w * 0.48, y: h * 0.72), CGPoint(x: w * 0.70, y: h * 0.57),
                CGPoint(x: w * 0.84, y: h * 0.70), CGPoint(x: w * 0.73, y: h * 0.91)
            ], light)

            // Angular head and ears, the recognizable low-poly character silhouette.
            polygon([
                CGPoint(x: w * 0.28, y: h * 0.26), CGPoint(x: w * 0.38, y: h * 0.13),
                CGPoint(x: w * 0.48, y: h * 0.23), CGPoint(x: w * 0.68, y: h * 0.20),
                CGPoint(x: w * 0.82, y: h * 0.34), CGPoint(x: w * 0.77, y: h * 0.59),
                CGPoint(x: w * 0.55, y: h * 0.68), CGPoint(x: w * 0.31, y: h * 0.56)
            ], coat)
            polygon([
                CGPoint(x: w * 0.28, y: h * 0.26), CGPoint(x: w * 0.38, y: h * 0.13),
                CGPoint(x: w * 0.44, y: h * 0.37), CGPoint(x: w * 0.31, y: h * 0.56)
            ], shade)
            polygon([
                CGPoint(x: w * 0.44, y: h * 0.37), CGPoint(x: w * 0.68, y: h * 0.20),
                CGPoint(x: w * 0.82, y: h * 0.34), CGPoint(x: w * 0.77, y: h * 0.59),
                CGPoint(x: w * 0.55, y: h * 0.68)
            ], light)
            polygon([
                CGPoint(x: w * 0.63, y: h * 0.23), CGPoint(x: w * 0.75, y: h * 0.12),
                CGPoint(x: w * 0.82, y: h * 0.34), CGPoint(x: w * 0.68, y: h * 0.37)
            ], mid)

            // Eyes are squares instead of emoji/text so the image stays geometric.
            polygon([
                CGPoint(x: w * 0.42, y: h * 0.40), CGPoint(x: w * 0.48, y: h * 0.40),
                CGPoint(x: w * 0.48, y: h * 0.47), CGPoint(x: w * 0.42, y: h * 0.47)
            ], outline)
            polygon([
                CGPoint(x: w * 0.64, y: h * 0.39), CGPoint(x: w * 0.70, y: h * 0.39),
                CGPoint(x: w * 0.70, y: h * 0.46), CGPoint(x: w * 0.64, y: h * 0.46)
            ], outline)
            polygon([
                CGPoint(x: w * 0.53, y: h * 0.51), CGPoint(x: w * 0.59, y: h * 0.51),
                CGPoint(x: w * 0.56, y: h * 0.56)
            ], Color(hex: style.accentHex))
        }
    }
}

struct StatBar: View {
    let title: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text(title).font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.66))
                Spacer()
                Text("\(value)").font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(PetverseTheme.ink.opacity(0.08))
                    Capsule().fill(color).frame(width: proxy.size.width * CGFloat(value) / 100)
                }
            }
            .frame(height: 9)
        }
    }
}

struct SceneCard: View {
    let scene: PetScene
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Text(scene.emoji).font(.system(size: 28))
                VStack(alignment: .leading, spacing: 3) {
                    Text(scene.title).font(.system(size: 16, weight: .bold, design: .rounded))
                    Text(scene.subtitle).font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.55))
                }
                Spacer()
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? PetverseTheme.coral : PetverseTheme.ink.opacity(0.2))
            }
            .foregroundStyle(PetverseTheme.ink)
            .padding(15)
            .background(.white.opacity(isSelected ? 0.92 : 0.62), in: RoundedRectangle(cornerRadius: 17, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 17, style: .continuous).stroke(isSelected ? PetverseTheme.coral.opacity(0.5) : PetverseTheme.ink.opacity(0.08), lineWidth: isSelected ? 1.5 : 1))
        }
        .buttonStyle(.plain)
    }
}
