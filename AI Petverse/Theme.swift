import SwiftUI

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var value: UInt64 = 0
        scanner.scanHexInt64(&value)
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}

enum PetverseTheme {
    static let ink = Color(hex: "19223A")
    static let mist = Color(hex: "F7F8FC")
    static let lavender = Color(hex: "EEEAFE")
    static let coral = Color(hex: "FF7D6B")
    static let mint = Color(hex: "DDF7EE")
    static let purple = Color(hex: "8B5CF6")
    static let electricBlue = Color(hex: "45D7FF")
    static let hotPink = Color(hex: "FF4FB3")
}

struct SoftBackground: View {
    var accent: Color = PetverseTheme.lavender

    var body: some View {
        ZStack {
            PetverseTheme.mist.ignoresSafeArea()
            Circle()
                .fill(accent.opacity(0.68))
                .frame(width: 290, height: 290)
                .blur(radius: 2)
                .offset(x: 150, y: -330)
            Circle()
                .fill(Color.white.opacity(0.75))
                .frame(width: 240, height: 240)
                .blur(radius: 1)
                .offset(x: -170, y: 320)
            PixelGrid()
        }
    }
}

struct PixelGrid: View {
    var body: some View {
        Canvas { context, size in
            let spacing: CGFloat = 24
            var path = Path()
            stride(from: 0, through: size.width, by: spacing).forEach { x in
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
            }
            stride(from: 0, through: size.height, by: spacing).forEach { y in
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
            }
            context.stroke(path, with: .color(PetverseTheme.ink.opacity(0.035)), lineWidth: 1)
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }
}

struct PixelPanel: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 28, style: .continuous)
            .fill(.white.opacity(0.74))
            .overlay {
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(PetverseTheme.electricBlue.opacity(0.24), lineWidth: 2)
            }
            .overlay(alignment: .topTrailing) {
                Circle().fill(PetverseTheme.hotPink.opacity(0.2)).frame(width: 74, height: 74).blur(radius: 4).offset(x: 16, y: -16)
            }
    }
}
