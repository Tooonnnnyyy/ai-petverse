import SwiftUI
import UIKit

struct BrandMark: View {
    var body: some View {
        HStack(spacing: 9) {
            ZStack {
                Circle().fill(PetverseTheme.ink)
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
    var size: CGFloat = 160

    var body: some View {
        ZStack {
            Circle()
                .fill(Color(hex: style.accentHex).opacity(0.18))
                .frame(width: size, height: size)
            Circle()
                .fill(.white.opacity(0.88))
                .frame(width: size * 0.82, height: size * 0.82)
                .shadow(color: PetverseTheme.ink.opacity(0.1), radius: 20, y: 10)
            if let imageData, let uiImage = UIImage(data: imageData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: size * 0.66, height: size * 0.66)
                    .clipShape(Circle())
            } else {
                Text(style.emoji).font(.system(size: size * 0.42))
            }
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
