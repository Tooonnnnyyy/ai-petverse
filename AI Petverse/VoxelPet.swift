import Foundation

/// What a pet looks like, as data. A vision model will fill this in from a photo;
/// until then it is derived from the appearance picker. The voxel builder is a
/// pure function of these traits, so a pet renders the same everywhere.
struct PetTraits: Codable, Equatable, Sendable {
    enum Species: String, Codable, CaseIterable, Sendable { case dog, cat }
    enum Size: String, Codable, CaseIterable, Sendable { case small, medium, large }
    enum Ears: String, Codable, CaseIterable, Sendable { case pointy, floppy, folded }
    enum Snout: String, Codable, CaseIterable, Sendable { case short, medium, long }
    enum Tail: String, Codable, CaseIterable, Sendable { case straight, curled, fluffy, bob }
    enum Pattern: String, Codable, CaseIterable, Sendable { case solid, tuxedo, spots, tabby, points }

    var species: Species = .dog
    var size: Size = .medium
    var ears: Ears = .pointy
    var snout: Snout = .medium
    var tail: Tail = .curled
    var pattern: Pattern = .tuxedo
    var primaryHex = "F59E0B"
    var secondaryHex = "FFF4E0"
    var eyeHex = "19223A"
}

extension PetTraits {
    /// Bridges pets saved before traits existed: the coat colour comes from the
    /// appearance picker and the rest uses the default dog.
    init(appearance: PetAppearance) {
        self.init()
        primaryHex = appearance.colorHex
    }
}

enum PetAccessory: String, CaseIterable, Sendable {
    case none
    case starCollar = "star collar"
    case partyHat = "party hat"
    case flower

    init(appearance: PetAppearance) {
        self = PetAccessory(rawValue: appearance.accessory) ?? .none
    }
}

/// Palette slots; the renderer resolves the trait-driven ones to the pet's colours.
enum VoxelColor: Sendable {
    case primary, secondary, eye, ink, inner, gold, pink, blue, white
}

struct VoxelPosition: Hashable, Sendable {
    var x: Int
    var y: Int
    var z: Int
}

enum VoxelPart: String, CaseIterable, Sendable {
    case body, head, ears, tail, frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg

    /// Ears ride on the head; every other part hangs off the pet's root.
    var parent: VoxelPart? { self == .ears ? .head : nil }
}

/// Model space is one unit per voxel, y up, feet on y = 0, the pet facing +z.
/// A voxel at (x, y, z) fills the cube from that corner to (x + 1, y + 1, z + 1).
struct VoxelPetModel: Equatable, Sendable {
    var voxels: [VoxelPart: [VoxelPosition: VoxelColor]] = [:]
    /// The joint each part rotates around during animation.
    var pivots: [VoxelPart: SIMD3<Float>] = [:]

    var count: Int { voxels.values.reduce(0) { $0 + $1.count } }
}

struct VoxelPetBuilder {
    static func build(_ traits: PetTraits, accessory: PetAccessory = .none) -> VoxelPetModel {
        var builder = VoxelPetBuilder(traits: traits)
        builder.buildBody()
        builder.buildLegs()
        builder.buildHead()
        builder.buildEars()
        builder.buildTail()
        builder.add(accessory)
        return builder.model
    }

    private struct Proportions {
        let width, height, length, legHeight, headWidth, headHeight, headDepth: Int
    }

    private let traits: PetTraits
    private let shape: Proportions
    private var model = VoxelPetModel()

    private init(traits: PetTraits) {
        self.traits = traits
        switch (traits.species, traits.size) {
        case (.dog, .small): shape = Proportions(width: 5, height: 4, length: 7, legHeight: 2, headWidth: 5, headHeight: 5, headDepth: 4)
        case (.dog, .medium): shape = Proportions(width: 6, height: 5, length: 9, legHeight: 3, headWidth: 6, headHeight: 6, headDepth: 5)
        case (.dog, .large): shape = Proportions(width: 7, height: 6, length: 11, legHeight: 4, headWidth: 7, headHeight: 6, headDepth: 5)
        case (.cat, .small): shape = Proportions(width: 4, height: 4, length: 7, legHeight: 2, headWidth: 5, headHeight: 5, headDepth: 4)
        case (.cat, .medium): shape = Proportions(width: 5, height: 4, length: 8, legHeight: 3, headWidth: 6, headHeight: 5, headDepth: 4)
        case (.cat, .large): shape = Proportions(width: 6, height: 5, length: 10, legHeight: 3, headWidth: 7, headHeight: 6, headDepth: 5)
        }
    }

    // MARK: Layout

    private var bodyX: ClosedRange<Int> { centered(shape.width) }
    private var bodyY: ClosedRange<Int> { shape.legHeight...(shape.legHeight + shape.height - 1) }
    private var bodyZ: ClosedRange<Int> { centered(shape.length) }
    private var headX: ClosedRange<Int> { centered(shape.headWidth) }
    // The head sits in front of the chest and rises above the back, so it never
    // shares a voxel with the body.
    private var headY: ClosedRange<Int> { (bodyY.upperBound - 2)...(bodyY.upperBound - 3 + shape.headHeight) }
    private var headZ: ClosedRange<Int> { (bodyZ.upperBound + 1)...(bodyZ.upperBound + shape.headDepth) }
    private var earZ: Int { headZ.upperBound - 2 }

    private var snoutLength: Int {
        switch (traits.species, traits.snout) {
        case (.dog, .short): return 1
        case (.dog, .medium): return 2
        case (.dog, .long): return 3
        case (.cat, .short): return 0
        case (.cat, .medium): return 1
        case (.cat, .long): return 2
        }
    }

    // MARK: Parts

    private mutating func buildBody() {
        for x in bodyX {
            for y in bodyY {
                for z in bodyZ {
                    set(.body, x, y, z, bodyColor(x: x, y: y, z: z))
                }
            }
        }
        model.pivots[.body] = SIMD3(center(bodyX), Float(bodyY.lowerBound), center(bodyZ))
    }

    private mutating func buildLegs() {
        let left = bodyX.lowerBound...(bodyX.lowerBound + 1)
        let right = (bodyX.upperBound - 1)...bodyX.upperBound
        let front = (bodyZ.upperBound - 1)...bodyZ.upperBound
        let back = bodyZ.lowerBound...(bodyZ.lowerBound + 1)
        for (part, xs, zs) in [(VoxelPart.frontLeftLeg, left, front), (.frontRightLeg, right, front), (.backLeftLeg, left, back), (.backRightLeg, right, back)] {
            for x in xs {
                for y in 0..<shape.legHeight {
                    for z in zs {
                        set(part, x, y, z, legColor(x: x, y: y, z: z))
                    }
                }
            }
            model.pivots[part] = SIMD3(center(xs), Float(shape.legHeight), center(zs))
        }
    }

    private mutating func buildHead() {
        for x in headX {
            for y in headY {
                for z in headZ {
                    set(.head, x, y, z, headColor(x: x, y: y, z: z))
                }
            }
        }

        // Muzzle: the lower two rows, pushed forward by the snout length.
        let snoutX = centered(shape.headWidth - 2)
        let snoutY = headY.lowerBound...(headY.lowerBound + 1)
        let muzzle: VoxelColor = traits.pattern == .tuxedo || traits.pattern == .points ? .secondary : .primary
        if snoutLength > 0 {
            for x in snoutX {
                for y in snoutY {
                    for z in (headZ.upperBound + 1)...(headZ.upperBound + snoutLength) {
                        set(.head, x, y, z, muzzle)
                    }
                }
            }
        }
        let noseZ = headZ.upperBound + snoutLength
        for x in centered(shape.headWidth.isMultiple(of: 2) ? 2 : 1) {
            set(.head, x, snoutY.upperBound, noseZ, traits.species == .cat ? .inner : .ink)
        }

        let eyeTop = headY.lowerBound + (shape.headHeight >= 6 ? 3 : 2)
        let eyeRows = shape.headHeight >= 6 ? (eyeTop - 1)...eyeTop : eyeTop...eyeTop
        for x in [headX.lowerBound + 1, headX.upperBound - 1] {
            for y in eyeRows {
                set(.head, x, y, headZ.upperBound, .eye)
            }
        }
        model.pivots[.head] = SIMD3(center(headX), Float(bodyY.upperBound - 1), Float(headZ.lowerBound))
    }

    private mutating func buildEars() {
        let top = headY.upperBound
        let earColor: VoxelColor = traits.pattern == .points ? .secondary : .primary
        let sides: [(outer: Int, inner: Int, outward: Int)] = [
            (headX.lowerBound, headX.lowerBound + 1, -1),
            (headX.upperBound, headX.upperBound - 1, 1)
        ]
        for side in sides {
            switch traits.ears {
            case .pointy:
                let tall = traits.species == .cat ? 3 : 2
                for z in (earZ - 1)...earZ {
                    set(.ears, side.outer, top + 1, z, earColor)
                    set(.ears, side.inner, top + 1, z, z == earZ ? .inner : earColor)
                    for level in 2...tall {
                        set(.ears, side.outer, top + level, z, earColor)
                    }
                }
            case .floppy:
                for z in (earZ - 1)...earZ {
                    set(.ears, side.outer, top + 1, z, earColor)
                    for drop in 0...3 {
                        set(.ears, side.outer + side.outward, top - drop, z, earColor)
                    }
                }
            case .folded:
                for z in (earZ - 1)...earZ {
                    set(.ears, side.outer, top + 1, z, earColor)
                    set(.ears, side.inner, top + 1, z, earColor)
                }
            }
        }
        model.pivots[.ears] = SIMD3(center(headX), Float(top + 1), Float(earZ))
    }

    private mutating func buildTail() {
        let baseX = (bodyX.lowerBound + bodyX.upperBound) / 2
        let top = bodyY.upperBound
        let back = bodyZ.lowerBound
        // (rise, reach) steps from the top of the rump, ordered base to tip.
        let path: [(Int, Int)]
        switch (traits.tail, traits.species) {
        case (.straight, .dog): path = [(0, -1), (1, -1), (1, -2), (2, -2), (3, -2)]
        case (.straight, .cat): path = [(0, -1), (1, -1), (2, -1), (3, -1), (4, -1), (5, -1), (5, 0)]
        case (.curled, _): path = [(0, -1), (1, -1), (2, -1), (3, -1), (3, 0), (2, 1)]
        case (.fluffy, _): path = [(0, -1), (1, -1), (1, -2), (2, -2), (3, -2), (4, -2)]
        case (.bob, .dog): path = [(0, -1)]
        case (.bob, .cat): path = [(0, -1), (1, -1)]
        }
        let columns = traits.tail == .fluffy ? [baseX - 1, baseX] : [baseX]
        for (index, step) in path.enumerated() {
            let isTip = index == path.count - 1
            let color: VoxelColor
            switch traits.pattern {
            case .points: color = .secondary
            case .tabby: color = index.isMultiple(of: 2) ? .primary : .secondary
            case .tuxedo: color = isTip && path.count > 1 ? .secondary : .primary
            case .solid, .spots: color = .primary
            }
            for x in columns {
                set(.tail, x, top + step.0, back + step.1, color)
            }
        }
        model.pivots[.tail] = SIMD3(Float(baseX) + 0.5, Float(top), Float(back))
    }

    private mutating func add(_ accessory: PetAccessory) {
        let top = headY.upperBound
        switch accessory {
        case .none:
            return
        case .starCollar:
            // Recolour the slice of the body the head rests on, plus a tag under the chin.
            for x in bodyX {
                for y in (bodyY.upperBound - 1)...bodyY.upperBound {
                    set(.body, x, y, bodyZ.upperBound, .gold)
                }
            }
            set(.body, (bodyX.lowerBound + bodyX.upperBound) / 2, headY.lowerBound - 1, bodyZ.upperBound + 1, .gold)
        case .partyHat:
            // In front of the ears so the two never overlap.
            let hatX = centered(shape.headWidth.isMultiple(of: 2) ? 2 : 3)
            let hatZ = (headZ.upperBound - 1)...headZ.upperBound
            for x in hatX {
                for z in hatZ {
                    set(.head, x, top + 1, z, .pink)
                    set(.head, x, top + 2, z, .blue)
                }
            }
            set(.head, hatX.lowerBound, top + 3, headZ.upperBound, .white)
        case .flower:
            let x = headX.upperBound
            let z = headZ.upperBound - 1
            set(.head, x, top + 1, z, .gold)
            set(.head, x - 1, top + 1, z, .pink)
            set(.head, x, top + 1, z + 1, .pink)
            set(.head, x, top + 2, z, .pink)
        }
    }

    // MARK: Coat patterns

    private func bodyColor(x: Int, y: Int, z: Int) -> VoxelColor {
        switch traits.pattern {
        case .solid, .points:
            return .primary
        case .tuxedo:
            let belly = y == bodyY.lowerBound
            let chest = z == bodyZ.upperBound && y < bodyY.upperBound
            return belly || chest ? .secondary : .primary
        case .spots:
            return Self.noise(x, y, z) % 6 == 0 ? .secondary : .primary
        case .tabby:
            return z.isMultiple(of: 3) && y > bodyY.lowerBound + 1 ? .secondary : .primary
        }
    }

    private func legColor(x: Int, y: Int, z: Int) -> VoxelColor {
        switch traits.pattern {
        case .points: return .secondary
        case .tuxedo: return y == 0 ? .secondary : .primary
        case .spots: return Self.noise(x, y, z) % 6 == 0 ? .secondary : .primary
        case .solid, .tabby: return .primary
        }
    }

    private func headColor(x: Int, y: Int, z: Int) -> VoxelColor {
        let face = z == headZ.upperBound
        switch traits.pattern {
        case .solid:
            return .primary
        case .tuxedo:
            let blaze = face && centered(2).contains(x) && y < headY.lowerBound + 3
            return blaze ? .secondary : .primary
        case .spots:
            return Self.noise(x, y, z) % 9 == 0 ? .secondary : .primary
        case .tabby:
            return y == headY.upperBound && x.isMultiple(of: 2) ? .secondary : .primary
        case .points:
            return face && y < headY.lowerBound + 3 ? .secondary : .primary
        }
    }

    // MARK: Helpers

    private mutating func set(_ part: VoxelPart, _ x: Int, _ y: Int, _ z: Int, _ color: VoxelColor) {
        model.voxels[part, default: [:]][VoxelPosition(x: x, y: y, z: z)] = color
    }

    private func centered(_ count: Int) -> ClosedRange<Int> {
        let lower = -(count / 2)
        return lower...(lower + count - 1)
    }

    private func center(_ range: ClosedRange<Int>) -> Float {
        Float(range.lowerBound + range.upperBound + 1) / 2
    }

    /// Stable across launches and platforms, unlike Swift's seeded `Hasher`.
    static func noise(_ x: Int, _ y: Int, _ z: Int) -> Int {
        let mixed = (x &* 73_856_093) ^ (y &* 19_349_663) ^ (z &* 83_492_791)
        return mixed & 0x7FFF_FFFF
    }
}
