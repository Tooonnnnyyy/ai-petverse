import RealityKit
import SwiftUI
import UIKit

/// The 3D home world, rendered with RealityKit (SceneKit is deprecated).
/// Everything uses unlit materials shaded by face direction, so the voxel look
/// does not depend on lighting and matches what a web client can reproduce.
struct VoxelWorldView: View {
    let scene: PetScene
    let traits: PetTraits
    var accessory: PetAccessory = .none
    var isPlaying = false
    /// Interactive worlds turn with a drag and let the pet roam; small previews
    /// keep the pet in place.
    var isInteractive = true

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var world = VoxelWorld()
    @State private var dragStartYaw: Float?

    var body: some View {
        RealityView { content in
            content.camera = .virtual
            world.install(in: &content)
        } update: { _ in
            world.configure(VoxelWorld.Configuration(
                scene: scene,
                traits: traits,
                accessory: accessory,
                roams: isInteractive && !reduceMotion,
                framing: isInteractive ? .home : .preview
            ))
            world.setPlaying(isPlaying)
        }
        .gesture(turnGesture, including: isInteractive ? .all : .none)
        .accessibilityElement()
        .accessibilityLabel("\(traits.species == .cat ? "Cat" : "Dog") in \(scene.title)")
    }

    private var turnGesture: some Gesture {
        DragGesture(minimumDistance: 4)
            .onChanged { value in
                let start = dragStartYaw ?? world.yaw
                dragStartYaw = start
                world.yaw = start + Float(value.translation.width) * 0.01
            }
            .onEnded { _ in dragStartYaw = nil }
    }
}

@MainActor
final class VoxelWorld {
    struct Configuration: Equatable {
        var scene: PetScene
        var traits: PetTraits
        var accessory: PetAccessory
        var roams: Bool
        var framing: Framing
    }

    enum Framing: Equatable {
        /// Full screen behind the home controls: the island sits in the upper half.
        case home
        /// Small cards: the island is centred.
        case preview

        /// Half the visible width, in world units (RealityKit's orthographic scale).
        var halfWidth: Float { self == .home ? 4.6 : 4.8 }
        var focus: SIMD3<Float> { self == .home ? [0, -1.5, 0] : [0, -0.2, 0] }
    }

    var yaw: Float = 0 {
        didSet { root.orientation = simd_quatf(angle: yaw, axis: [0, 1, 0]) }
    }

    private let root = Entity()
    private let camera = Entity()
    private let backdrop = ModelEntity()
    private var configuration: Configuration?
    private var pet: PetRig?
    private var subscription: EventSubscription?

    func install(in content: inout RealityViewCameraContent) {
        // A far plane parented to the camera stands in for a background colour.
        backdrop.model = ModelComponent(mesh: .generatePlane(width: 600, height: 600), materials: [])
        backdrop.position = [0, 0, -150]
        camera.addChild(backdrop)

        content.add(camera)
        content.add(root)
        subscription = content.subscribe(to: SceneEvents.Update.self) { [weak self] event in
            self?.pet?.tick(Float(event.deltaTime))
        }
    }

    func configure(_ next: Configuration) {
        guard next != configuration else { return }
        configuration = next
        var projection = OrthographicCameraComponent()
        projection.scale = next.framing.halfWidth
        projection.scaleDirection = .horizontal
        projection.near = 0.1
        projection.far = 200
        camera.components.set(projection)
        camera.look(at: next.framing.focus, from: next.framing.focus + [0, 7.2, 11], relativeTo: nil)
        backdrop.model?.materials = [FlatShadedMesh.material(rgb: Self.rgb(next.scene.skyHex), opacity: 1)]
        root.children.removeAll()
        if let island = try? IslandBuilder.makeIsland(next.scene) {
            root.addChild(island)
        }
        let rig = try? PetRig(traits: next.traits, accessory: next.accessory, roams: next.roams)
        if let rig {
            root.addChild(rig.entity)
        }
        pet = rig
    }

    func setPlaying(_ playing: Bool) {
        pet?.setPlaying(playing)
    }

    nonisolated static func rgb(_ hex: String) -> SIMD3<Float> {
        var value: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&value)
        return SIMD3(Float((value >> 16) & 0xFF), Float((value >> 8) & 0xFF), Float(value & 0xFF)) / 255
    }
}

// MARK: - Pet

@MainActor
final class PetRig {
    static let voxelSize: Float = 0.11
    /// Places the pet can walk to, as (x, z) on the island floor.
    static let spots: [SIMD2<Float>] = [[0, 0.5], [-1.7, 0.1], [1.2, -0.4], [-0.9, 1.6], [1.2, 1.5], [-2.3, -0.5]]
    /// Facing slightly to the right of the camera reads as a three-quarter view.
    static let restingHeading: Float = 0.45

    let entity = Entity()
    private let rig = Entity()
    private var parts: [VoxelPart: Entity] = [:]
    private let species: PetTraits.Species
    private let roams: Bool

    private enum Activity {
        case resting(until: Float)
        case walking(to: SIMD2<Float>)
        case celebrating(until: Float)
    }

    private var activity: Activity
    private var time: Float = 0
    private var heading: Float = PetRig.restingHeading
    private var stride: Float = 0
    private var hopElapsed: Float?
    private var wasPlaying = false
    private var nextSpot = 0
    private var random = SeededRandom(seed: 0x9E37_79B9)

    init(traits: PetTraits, accessory: PetAccessory, roams: Bool) throws {
        species = traits.species
        self.roams = roams
        activity = .resting(until: 1.5)

        let model = VoxelPetBuilder.build(traits, accessory: accessory)
        let palette = Palette(traits: traits)
        for part in VoxelPart.allCases {
            guard let voxels = model.voxels[part], let pivot = model.pivots[part] else { continue }
            let mesh = FlatShadedMesh.voxels(voxels, origin: pivot, size: Self.voxelSize, palette: palette.rgb)
            let node = try mesh.makeEntity()
            let parentPivot = part.parent.flatMap { model.pivots[$0] } ?? .zero
            node.position = (pivot - parentPivot) * Self.voxelSize
            (part.parent.flatMap { parts[$0] } ?? rig).addChild(node)
            parts[part] = node
        }

        var shadow = FlatShadedMesh.material(rgb: .zero, opacity: 0.18)
        shadow.faceCulling = .none
        let blob = ModelEntity(mesh: .generatePlane(width: 1.3, depth: 1.9, cornerRadius: 0.6), materials: [shadow])
        blob.position = [0, 0.01, 0.1]
        entity.addChild(blob)
        entity.addChild(rig)
        entity.position = [Self.spots[0].x, 0, Self.spots[0].y]
        entity.orientation = simd_quatf(angle: heading, axis: [0, 1, 0])
    }

    func setPlaying(_ playing: Bool) {
        defer { wasPlaying = playing }
        guard playing, !wasPlaying else { return }
        hopElapsed = 0
        activity = .celebrating(until: time + 1.6)
    }

    func tick(_ delta: Float) {
        let dt = min(delta, 1 / 20)
        time += dt
        var targetHeading = Self.restingHeading
        var isWalking = false

        switch activity {
        case .resting(let until):
            if roams, time > until {
                activity = .walking(to: Self.spots[pickSpot()])
            }
        case .celebrating(let until):
            if time > until { activity = .resting(until: time + 2) }
        case .walking(let target):
            let here = SIMD2(entity.position.x, entity.position.z)
            let offset = target - here
            let distance = simd_length(offset)
            if distance < 0.05 {
                activity = .resting(until: time + 2.5 + random.next() * 3)
            } else {
                targetHeading = atan2(offset.x, offset.y)
                // Turn first, then walk, so the pet never slides sideways.
                if abs(angleBetween(heading, targetHeading)) < 0.5 {
                    let step = min(distance, 0.75 * dt)
                    let move = offset / distance * step
                    entity.position += [move.x, 0, move.y]
                    isWalking = true
                }
            }
        }

        heading += angleBetween(heading, targetHeading) * min(1, dt * 6)
        entity.orientation = simd_quatf(angle: heading, axis: [0, 1, 0])
        pose(isWalking: isWalking, dt: dt)
    }

    private func pose(isWalking: Bool, dt: Float) {
        let celebrating: Bool
        if case .celebrating = activity { celebrating = true } else { celebrating = false }

        if let elapsed = hopElapsed {
            let hops: Float = 2
            let duration: Float = 0.38
            if elapsed < hops * duration {
                rig.position.y = abs(sin(elapsed / duration * .pi)) * 0.4
                hopElapsed = elapsed + dt
            } else {
                rig.position.y = 0
                hopElapsed = nil
            }
        }

        let breathe = 1 + 0.025 * sin(time * 2.4)
        parts[.body]?.scale = [1, breathe, 1]

        let lookAround = isWalking || celebrating ? 0 : sin(time * 0.6) * 0.25
        let nod = celebrating ? -0.18 : sin(time * 1.7) * 0.05
        parts[.head]?.orientation = simd_quatf(angle: lookAround, axis: [0, 1, 0]) * simd_quatf(angle: nod, axis: [1, 0, 0])

        let twitch = max(0, sin(time * 0.9) - 0.92) * 3
        parts[.ears]?.orientation = simd_quatf(angle: -twitch, axis: [1, 0, 0])

        let (speed, amplitude): (Float, Float) = switch (species, celebrating) {
        case (.dog, false): (9, 0.4)
        case (.dog, true): (18, 0.6)
        case (.cat, false): (2.2, 0.3)
        case (.cat, true): (5, 0.45)
        }
        parts[.tail]?.orientation = simd_quatf(angle: sin(time * speed) * amplitude, axis: [0, 1, 0])

        stride = isWalking ? stride + dt * 10 : stride * max(0, 1 - dt * 8)
        let swing = sin(stride) * (isWalking ? 0.55 : 0)
        for (part, direction) in [(VoxelPart.frontLeftLeg, Float(1)), (.backRightLeg, 1), (.frontRightLeg, -1), (.backLeftLeg, -1)] {
            parts[part]?.orientation = simd_quatf(angle: swing * direction, axis: [1, 0, 0])
        }
    }

    private func pickSpot() -> Int {
        // Walk somewhere new each time; the seeded sequence keeps behaviour reproducible.
        var candidate = Int(random.next() * Float(Self.spots.count)) % Self.spots.count
        if candidate == nextSpot { candidate = (candidate + 1) % Self.spots.count }
        nextSpot = candidate
        return candidate
    }

    private func angleBetween(_ from: Float, _ to: Float) -> Float {
        var difference = (to - from).truncatingRemainder(dividingBy: 2 * .pi)
        if difference > .pi { difference -= 2 * .pi }
        if difference < -.pi { difference += 2 * .pi }
        return difference
    }
}

private struct Palette {
    let traits: PetTraits

    func rgb(_ color: VoxelColor) -> SIMD3<Float> {
        switch color {
        case .primary: return VoxelWorld.rgb(traits.primaryHex)
        case .secondary: return VoxelWorld.rgb(traits.secondaryHex)
        case .eye: return VoxelWorld.rgb(traits.eyeHex)
        case .ink: return VoxelWorld.rgb("19223A")
        case .inner: return VoxelWorld.rgb("F2A7B0")
        case .gold: return VoxelWorld.rgb("F5B942")
        case .pink: return VoxelWorld.rgb("FF4FB3")
        case .blue: return VoxelWorld.rgb("45D7FF")
        case .white: return VoxelWorld.rgb("FFFFFF")
        }
    }
}

/// Small deterministic generator (LCG) so the pet's wandering is reproducible.
private struct SeededRandom {
    private var state: UInt32

    init(seed: UInt32) { state = seed }

    mutating func next() -> Float {
        state = state &* 1_664_525 &+ 1_013_904_223
        return Float(state >> 8) / Float(1 << 24)
    }
}

// MARK: - Island

private enum IslandBuilder {
    struct Block {
        let min: SIMD3<Float>
        let max: SIMD3<Float>
        let hex: String

        init(_ min: SIMD3<Float>, _ max: SIMD3<Float>, _ hex: String) {
            self.min = min
            self.max = max
            self.hex = hex
        }
    }

    @MainActor
    static func makeIsland(_ scene: PetScene) throws -> ModelEntity {
        var mesh = FlatShadedMesh()
        for block in blocks(for: scene) {
            mesh.addBox(from: block.min, to: block.max, rgb: VoxelWorld.rgb(block.hex))
        }
        return try mesh.makeEntity()
    }

    static func blocks(for scene: PetScene) -> [Block] {
        switch scene {
        case .pixelGrove: return grove
        case .neonArcade: return arcade
        }
    }

    private static var grove: [Block] {
        var blocks: [Block] = [
            Block([-4.1, -0.34, -2.9], [4.1, 0, 2.9], "6C9F63"),
            Block([-3.6, -0.9, -2.5], [3.6, -0.34, 2.5], "5B8456"),
            Block([-2.6, -1.5, -1.6], [2.6, -0.9, 1.6], "4A7050"),
            Block([-4.1, -0.3, 2.9], [4.1, -0.06, 3.5], "5CC8D7"),
            // Dog house: the pet's home base.
            Block([1.9, 0, -2.7], [3.1, 0.8, -1.7], "C58A58"),
            Block([2.3, 0, -1.7], [2.7, 0.55, -1.66], "5A3A22"),
            Block([1.8, 0.8, -2.8], [3.2, 1.0, -1.6], "E0605A"),
            Block([2.05, 1.0, -2.8], [2.95, 1.2, -1.6], "E0605A"),
            Block([2.3, 1.2, -2.8], [2.7, 1.38, -1.6], "E0605A"),
            // Food bowl.
            Block([1.0, 0, -1.2], [1.4, 0.12, -0.8], "45D7FF"),
            Block([1.07, 0.12, -1.13], [1.33, 0.16, -0.87], "C58A58"),
            // Crop patch.
            Block([-2.5, 0, -2.7], [1.1, 0.06, -2.1], "8A5A3C")
        ]
        for index in 0..<9 {
            let x = -3.6 + Float(index) * 0.82
            blocks.append(Block([x, 0, -0.12], [x + 0.72, 0.04, 0.6], "86B978"))
        }
        for x in Swift.stride(from: Float(-2.2), through: 0.8, by: 0.6) {
            blocks.append(Block([x - 0.06, 0.06, -2.46], [x + 0.06, 0.34, -2.34], "4E8E59"))
            blocks.append(Block([x - 0.12, 0.34, -2.52], [x + 0.12, 0.58, -2.28], "F5B942"))
        }
        for (x, z) in [(Float(-3.3), Float(-2.1)), (3.4, 1.6)] {
            blocks.append(Block([x - 0.18, 0, z - 0.18], [x + 0.18, 0.9, z + 0.18], "7A5133"))
            blocks.append(Block([x - 0.7, 0.9, z - 0.7], [x + 0.7, 1.6, z + 0.7], "4E8E59"))
            blocks.append(Block([x - 0.48, 1.6, z - 0.48], [x + 0.48, 2.05, z + 0.48], "5FA86A"))
            blocks.append(Block([x - 0.2, 2.05, z - 0.2], [x + 0.2, 2.3, z + 0.2], "74BE7C"))
        }
        for (x, z, hex) in [(Float(-2.9), Float(1.9), "FF7D6B"), (-0.2, 2.4, "FFFFFF"), (2.2, 0.4, "FF7D6B"), (-3.4, 0.9, "FFFFFF")] {
            blocks.append(Block([x, 0, z], [x + 0.14, 0.14, z + 0.14], hex))
        }
        return blocks
    }

    private static var arcade: [Block] {
        var blocks: [Block] = [
            Block([-4.1, -0.34, -2.9], [4.1, 0, 2.9], "1C1638"),
            Block([-3.6, -0.9, -2.5], [3.6, -0.34, 2.5], "241B4D"),
            Block([-2.6, -1.5, -1.6], [2.6, -0.9, 1.6], "15102B"),
            Block([-4.1, -0.12, 2.9], [4.1, -0.04, 2.98], "FF4FB3"),
            Block([-3.75, 0, -2.6], [-3.35, 3.2, -2.2], "FF4FB3"),
            Block([3.35, 0, -2.6], [3.75, 3.2, -2.2], "45D7FF"),
            Block([-1.7, 2.4, -2.75], [1.7, 3.0, -2.6], "8B5CF6"),
            Block([-1.4, 2.6, -2.6], [1.4, 2.8, -2.56], "C4B5FD"),
            Block([-2.6, 0, -2.6], [-1.8, 1.4, -1.9], "FF4FB3"),
            Block([-2.45, 0.85, -1.9], [-1.95, 1.25, -1.86], "45D7FF"),
            Block([1.8, 0, -2.6], [2.6, 1.4, -1.9], "45D7FF"),
            Block([1.95, 0.85, -1.9], [2.45, 1.25, -1.86], "FF4FB3"),
            Block([-3.2, 0, 1.0], [-2.5, 0.42, 1.7], "8B5CF6"),
            Block([2.5, 0, 1.0], [3.2, 0.42, 1.7], "F5B942"),
            Block([1.0, 0, -1.2], [1.4, 0.12, -0.8], "FF4FB3"),
            Block([1.07, 0.12, -1.13], [1.33, 0.16, -0.87], "F5B942")
        ]
        for column in 0..<10 {
            for row in 0..<7 where (column + row).isMultiple(of: 2) {
                let x = -4.0 + Float(column) * 0.8
                let z = -2.8 + Float(row) * 0.8
                blocks.append(Block([x, 0, z], [x + 0.76, 0.03, z + 0.76], "3E2B73"))
            }
        }
        return blocks
    }
}

// MARK: - Mesh building

/// Accumulates axis-aligned boxes into one mesh. Each face gets a fixed shade by
/// direction (a baked light from above-left), which is what makes unlit voxels
/// read as solid.
@MainActor
struct FlatShadedMesh {
    enum Face: CaseIterable {
        case top, bottom, left, right, front, back

        var normal: SIMD3<Float> {
            switch self {
            case .top: return [0, 1, 0]
            case .bottom: return [0, -1, 0]
            case .left: return [-1, 0, 0]
            case .right: return [1, 0, 0]
            case .front: return [0, 0, 1]
            case .back: return [0, 0, -1]
            }
        }

        var shade: Float {
            switch self {
            case .top: return 1
            case .front: return 0.86
            case .left: return 0.8
            case .right: return 0.7
            case .back: return 0.66
            case .bottom: return 0.55
            }
        }

        /// Corners wound counter-clockwise as seen from outside the box.
        func corners(_ a: SIMD3<Float>, _ b: SIMD3<Float>) -> [SIMD3<Float>] {
            switch self {
            case .top: return [[a.x, b.y, a.z], [a.x, b.y, b.z], [b.x, b.y, b.z], [b.x, b.y, a.z]]
            case .bottom: return [[a.x, a.y, a.z], [b.x, a.y, a.z], [b.x, a.y, b.z], [a.x, a.y, b.z]]
            case .right: return [[b.x, a.y, a.z], [b.x, b.y, a.z], [b.x, b.y, b.z], [b.x, a.y, b.z]]
            case .left: return [[a.x, a.y, a.z], [a.x, a.y, b.z], [a.x, b.y, b.z], [a.x, b.y, a.z]]
            case .front: return [[a.x, a.y, b.z], [b.x, a.y, b.z], [b.x, b.y, b.z], [a.x, b.y, b.z]]
            case .back: return [[a.x, a.y, a.z], [a.x, b.y, a.z], [b.x, b.y, a.z], [b.x, a.y, a.z]]
            }
        }
    }

    private struct MaterialKey: Hashable {
        let rgb: SIMD3<Float>
        let face: Face
    }

    private var positions: [SIMD3<Float>] = []
    private var normals: [SIMD3<Float>] = []
    private var indices: [UInt32] = []
    private var faceMaterials: [UInt32] = []
    private var materials: [UnlitMaterial] = []
    private var materialIndex: [MaterialKey: UInt32] = [:]

    /// One mesh for a part's voxels, positioned relative to `origin` (in voxel
    /// units) and skipping faces hidden by a neighbouring voxel.
    static func voxels(
        _ voxels: [VoxelPosition: VoxelColor],
        origin: SIMD3<Float>,
        size: Float,
        palette: (VoxelColor) -> SIMD3<Float>
    ) -> FlatShadedMesh {
        var mesh = FlatShadedMesh()
        // Sorted so vertex order is stable from run to run.
        let ordered = voxels.sorted { ($0.key.x, $0.key.y, $0.key.z) < ($1.key.x, $1.key.y, $1.key.z) }
        for (position, color) in ordered {
            let corner = SIMD3(Float(position.x), Float(position.y), Float(position.z))
            let visible = Face.allCases.filter { face in
                let n = face.normal
                let neighbour = VoxelPosition(x: position.x + Int(n.x), y: position.y + Int(n.y), z: position.z + Int(n.z))
                return voxels[neighbour] == nil
            }
            mesh.addBox(from: (corner - origin) * size, to: (corner + 1 - origin) * size, rgb: palette(color), faces: visible)
        }
        return mesh
    }

    mutating func addBox(from a: SIMD3<Float>, to b: SIMD3<Float>, rgb: SIMD3<Float>, faces: [Face] = Face.allCases) {
        for face in faces {
            let base = UInt32(positions.count)
            positions.append(contentsOf: face.corners(a, b))
            normals.append(contentsOf: Array(repeating: face.normal, count: 4))
            indices.append(contentsOf: [base, base + 1, base + 2, base, base + 2, base + 3])
            let index = material(for: MaterialKey(rgb: rgb, face: face))
            faceMaterials.append(contentsOf: [index, index])
        }
    }

    func makeEntity() throws -> ModelEntity {
        var descriptor = MeshDescriptor(name: "voxels")
        descriptor.positions = MeshBuffers.Positions(positions)
        descriptor.normals = MeshBuffers.Normals(normals)
        descriptor.primitives = .triangles(indices)
        descriptor.materials = .perFace(faceMaterials)
        return ModelEntity(mesh: try MeshResource.generate(from: [descriptor]), materials: materials)
    }

    static func material(rgb: SIMD3<Float>, opacity: Float) -> UnlitMaterial {
        var material = UnlitMaterial(applyPostProcessToneMap: false)
        material.color = .init(tint: UIColor(red: CGFloat(rgb.x), green: CGFloat(rgb.y), blue: CGFloat(rgb.z), alpha: 1))
        if opacity < 1 {
            material.blending = .transparent(opacity: .init(floatLiteral: opacity))
        }
        return material
    }

    private mutating func material(for key: MaterialKey) -> UInt32 {
        if let index = materialIndex[key] { return index }
        let index = UInt32(materials.count)
        materials.append(Self.material(rgb: key.rgb * key.face.shade, opacity: 1))
        materialIndex[key] = index
        return index
    }
}

extension PetScene {
    var skyHex: String {
        switch self {
        case .pixelGrove: return "B7E5D2"
        case .neonArcade: return "120D2D"
        }
    }
}
