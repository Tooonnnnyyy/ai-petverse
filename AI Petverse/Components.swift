import SwiftUI
import UIKit
import SceneKit

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

/// A dependency-free 3D world shell for the MVP. The geometry is intentionally
/// procedural so the two starter scenes can ship without a large binary asset
/// pipeline; Blender/RealityKit assets can replace these nodes later.
struct PetWorldView: UIViewRepresentable {
    let scene: PetScene
    let style: PetStyle
    let appearance: PetAppearance
    var isPlaying = false
    var allowsCameraControl = true

    final class Coordinator {
        var scene: PetScene?
        var style: PetStyle?
        var appearance: PetAppearance?
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.scene = PetWorldBuilder.makeScene(scene: scene, style: style, appearance: appearance)
        view.allowsCameraControl = allowsCameraControl
        view.autoenablesDefaultLighting = false
        view.antialiasingMode = .multisampling4X
        view.backgroundColor = .clear
        view.isPlaying = true
        context.coordinator.scene = scene
        context.coordinator.style = style
        context.coordinator.appearance = appearance
        return view
    }

    func updateUIView(_ view: SCNView, context: Context) {
        view.allowsCameraControl = allowsCameraControl
        if context.coordinator.scene != scene || context.coordinator.style != style || context.coordinator.appearance != appearance {
            view.scene = PetWorldBuilder.makeScene(scene: scene, style: style, appearance: appearance)
            context.coordinator.scene = scene
            context.coordinator.style = style
            context.coordinator.appearance = appearance
        }
        guard let pet = view.scene?.rootNode.childNode(withName: "pet", recursively: true) else { return }
        if isPlaying {
            pet.removeAction(forKey: "play")
            let jump = SCNAction.sequence([
                .moveBy(x: 0, y: 0.45, z: 0, duration: 0.22),
                .wait(duration: 0.16),
                .moveBy(x: 0, y: -0.45, z: 0, duration: 0.22)
            ])
            pet.runAction(.repeat(jump, count: 2), forKey: "play")
        }
    }
}

private enum PetWorldBuilder {
    static func makeScene(scene: PetScene, style: PetStyle, appearance: PetAppearance) -> SCNScene {
        let world = SCNScene()
        world.background.contents = scene == .neonArcade
            ? UIColor(hex: "120D2D")
            : UIColor(hex: "B7E5D2")

        let camera = SCNCamera()
        camera.usesOrthographicProjection = true
        camera.orthographicScale = 6.3
        let cameraNode = SCNNode()
        cameraNode.camera = camera
        cameraNode.position = SCNVector3(0, 5.2, 8.8)
        cameraNode.constraints = [SCNLookAtConstraint(target: world.rootNode)]
        world.rootNode.addChildNode(cameraNode)

        let ambient = SCNLight()
        ambient.type = .ambient
        ambient.intensity = scene == .neonArcade ? 520 : 760
        ambient.color = scene == .neonArcade ? UIColor.systemPurple : UIColor.white
        let ambientNode = SCNNode()
        ambientNode.light = ambient
        world.rootNode.addChildNode(ambientNode)

        let key = SCNLight()
        key.type = .omni
        key.intensity = 900
        key.color = UIColor(hex: style.accentHex)
        let keyNode = SCNNode()
        keyNode.light = key
        keyNode.position = SCNVector3(-3, 5, 4)
        world.rootNode.addChildNode(keyNode)

        addFloor(to: world.rootNode, scene: scene)
        if scene == .pixelGrove {
            addGroveDetails(to: world.rootNode)
        } else {
            addArcadeDetails(to: world.rootNode)
        }
        world.rootNode.addChildNode(makePet(style: style, appearance: appearance))
        return world
    }

    private static func addFloor(to root: SCNNode, scene: PetScene) {
        let floor = SCNBox(width: 8.2, height: 0.34, length: 5.8, chamferRadius: 0.06)
        floor.firstMaterial = material(scene == .pixelGrove ? UIColor(hex: "6C9F63") : UIColor(hex: "1C1638"))
        let floorNode = SCNNode(geometry: floor)
        floorNode.position = SCNVector3(0, -0.3, 0)
        root.addChildNode(floorNode)
        let underside = SCNBox(width: 5.8, height: 1.1, length: 3.7, chamferRadius: 0)
        underside.firstMaterial = material(scene == .pixelGrove ? UIColor(hex: "4A7050") : UIColor(hex: "241B4D"))
        let undersideNode = SCNNode(geometry: underside)
        undersideNode.position = SCNVector3(0, -0.96, 0.05)
        root.addChildNode(undersideNode)

        for x in stride(from: -3.2, through: 3.2, by: 0.8) {
            let tile = SCNBox(width: 0.72, height: 0.05, length: 0.72, chamferRadius: 0)
            tile.firstMaterial = material(scene == .pixelGrove ? UIColor(hex: "86B978") : UIColor(hex: "3E2B73"))
            let node = SCNNode(geometry: tile)
            node.position = SCNVector3(x, -0.1, 0.22)
            root.addChildNode(node)
        }

        if scene == .pixelGrove {
            let water = SCNBox(width: 8.7, height: 0.03, length: 0.58, chamferRadius: 0)
            water.firstMaterial = material(UIColor(hex: "5CC8D7"), emission: UIColor(hex: "193E70"))
            let waterNode = SCNNode(geometry: water)
            waterNode.position = SCNVector3(0, -0.08, 2.7)
            root.addChildNode(waterNode)
            addStairs(to: root, color: UIColor(hex: "C58A58"))
        } else {
            addStairs(to: root, color: UIColor(hex: "FF4FB3"))
        }
    }

    private static func addStairs(to root: SCNNode, color: UIColor) {
        for index in 0..<4 {
            let step = SCNBox(width: 1.25 + CGFloat(index) * 0.18, height: 0.18, length: 0.44, chamferRadius: 0)
            step.firstMaterial = material(color)
            let node = SCNNode(geometry: step)
            node.position = SCNVector3(-2.35 + Float(index) * 0.22, -0.02 + Float(index) * 0.18, 2.1 - Float(index) * 0.38)
            root.addChildNode(node)
        }
    }

    private static func addGroveDetails(to root: SCNNode) {
        for x in [-3.6, 3.4] {
            let trunk = SCNCylinder(radius: 0.24, height: 1.35)
            trunk.radialSegmentCount = 6
            trunk.firstMaterial = material(UIColor(hex: "7A5133"))
            let trunkNode = SCNNode(geometry: trunk)
            trunkNode.position = SCNVector3(x, 0.6, -0.5)
            root.addChildNode(trunkNode)
            let leaves = SCNPyramid(width: 1.55, height: 1.45, length: 1.55)
            leaves.firstMaterial = material(UIColor(hex: "4E8E59"))
            let leafNode = SCNNode(geometry: leaves)
            leafNode.position = SCNVector3(x, 1.7, -0.5)
            root.addChildNode(leafNode)
        }
        for x in stride(from: -2.5, through: 2.5, by: 1.25) {
            let crop = SCNPyramid(width: 0.28, height: 0.65, length: 0.28)
            crop.firstMaterial = material(UIColor(hex: "F5B942"))
            let cropNode = SCNNode(geometry: crop)
            cropNode.position = SCNVector3(x, 0.28, -2.1)
            root.addChildNode(cropNode)
        }
    }

    private static func addArcadeDetails(to root: SCNNode) {
        for (x, color) in [(-3.6, "FF4FB3"), (3.6, "45D7FF")] {
            let pillar = SCNBox(width: 0.26, height: 3.3, length: 0.26, chamferRadius: 0.02)
            pillar.firstMaterial = material(UIColor(hex: color), emission: UIColor(hex: color))
            let node = SCNNode(geometry: pillar)
            node.position = SCNVector3(x, 1.45, -0.8)
            root.addChildNode(node)
        }
        let sign = SCNBox(width: 3.3, height: 0.6, length: 0.12, chamferRadius: 0.04)
        sign.firstMaterial = material(UIColor(hex: "8B5CF6"), emission: UIColor(hex: "8B5CF6"))
        let signNode = SCNNode(geometry: sign)
        signNode.position = SCNVector3(0, 2.6, -1.0)
        root.addChildNode(signNode)
        for (x, z, color) in [(-2.3, -1.7, "FF4FB3"), (2.3, -1.7, "45D7FF"), (-2.2, 1.0, "8B5CF6"), (2.2, 1.0, "F5B942")] {
            let block = SCNBox(width: 0.8, height: 0.42, length: 0.8, chamferRadius: 0.08)
            block.firstMaterial = material(UIColor(hex: color), emission: UIColor(hex: color))
            let node = SCNNode(geometry: block)
            node.position = SCNVector3(x, 0.18, z)
            root.addChildNode(node)
        }
    }

    private static func makePet(style: PetStyle, appearance: PetAppearance) -> SCNNode {
        let root = SCNNode()
        root.name = "pet"
        root.position = SCNVector3(0, 0.18, 0.25)
        let coat = UIColor(hex: appearance.colorHex)

        let body = SCNBox(width: 1.42, height: 1.18, length: 1.18, chamferRadius: 0.16)
        body.firstMaterial = material(coat)
        let bodyNode = SCNNode(geometry: body)
        bodyNode.scale = SCNVector3(1.08, 0.94, 0.92)
        bodyNode.position = SCNVector3(0, 0.78, 0)
        root.addChildNode(bodyNode)

        let head = SCNBox(width: 1.12, height: 1.02, length: 0.98, chamferRadius: 0.16)
        head.firstMaterial = material(coat)
        let headNode = SCNNode(geometry: head)
        headNode.position = SCNVector3(0, 1.65, 0.05)
        root.addChildNode(headNode)

        for x in [-0.34, 0.34] {
            let ear = SCNPyramid(width: 0.32, height: 0.58, length: 0.32)
            ear.firstMaterial = material(coat)
            let earNode = SCNNode(geometry: ear)
            earNode.position = SCNVector3(x, 2.25, 0.03)
            root.addChildNode(earNode)
        }

        for x in [-0.43, 0.43] {
            let leg = SCNBox(width: 0.28, height: 0.55, length: 0.34, chamferRadius: 0.03)
            leg.firstMaterial = material(coat)
            let legNode = SCNNode(geometry: leg)
            legNode.position = SCNVector3(x, 0.19, 0.08)
            root.addChildNode(legNode)
        }

        let eyeMaterial = material(UIColor(hex: "19223A"))
        for x in [-0.2, 0.2] {
            let eye = SCNBox(width: 0.12, height: 0.14, length: 0.06, chamferRadius: 0)
            eye.firstMaterial = eyeMaterial
            let eyeNode = SCNNode(geometry: eye)
            eyeNode.position = SCNVector3(x, 1.72, 0.59)
            root.addChildNode(eyeNode)
        }

        let tail = SCNCylinder(radius: 0.11, height: 0.62)
        tail.radialSegmentCount = 6
        tail.firstMaterial = material(coat)
        let tailNode = SCNNode(geometry: tail)
        tailNode.position = SCNVector3(0.76, 0.98, -0.1)
        tailNode.eulerAngles = SCNVector3(0, 0, -Float.pi / 3)
        root.addChildNode(tailNode)

        if let symbol = appearance.accessorySymbol {
            let accessory = SCNText(string: symbol, extrusionDepth: 0.01)
            accessory.font = UIFont.systemFont(ofSize: 0.42)
            accessory.flatness = 0.2
            let accessoryNode = SCNNode(geometry: accessory)
            accessoryNode.scale = SCNVector3(0.012, 0.012, 0.012)
            accessoryNode.position = SCNVector3(-0.2, 2.55, 0.05)
            root.addChildNode(accessoryNode)
        }
        return root
    }

    private static func material(_ color: UIColor, emission: UIColor? = nil) -> SCNMaterial {
        let material = SCNMaterial()
        material.diffuse.contents = color
        material.roughness.contents = 0.88
        if let emission { material.emission.contents = emission }
        return material
    }
}

private extension UIColor {
    convenience init(hex: String) {
        var value: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&value)
        self.init(red: CGFloat((value >> 16) & 0xFF) / 255, green: CGFloat((value >> 8) & 0xFF) / 255, blue: CGFloat(value & 0xFF) / 255, alpha: 1)
    }
}

private extension PetAppearance {
    var colorHex: String {
        switch color {
        case "violet": return "8B5CF6"
        case "mint": return "49B98C"
        case "rose": return "FF4FB3"
        default: return "F59E0B"
        }
    }

    var accessorySymbol: String? {
        switch accessory {
        case "star collar": return "⭐️"
        case "party hat": return "🎉"
        case "flower": return "🌸"
        default: return nil
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
