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
        }
    }
}
