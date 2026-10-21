import XCTest
@testable import PetverseApp

final class VoxelPetTests: XCTestCase {
    func testSameTraitsBuildIdenticalModel() {
        let traits = PetTraits(species: .cat, size: .large, ears: .floppy, snout: .long, tail: .fluffy, pattern: .spots)

        XCTAssertEqual(VoxelPetBuilder.build(traits, accessory: .flower), VoxelPetBuilder.build(traits, accessory: .flower))
    }

    func testEveryTraitCombinationBuildsASoundModel() {
        var failures: [String] = []
        for species in PetTraits.Species.allCases {
            for size in PetTraits.Size.allCases {
                for ears in PetTraits.Ears.allCases {
                    for snout in PetTraits.Snout.allCases {
                        for tail in PetTraits.Tail.allCases {
                            for pattern in PetTraits.Pattern.allCases {
                                for accessory in PetAccessory.allCases {
                                    let traits = PetTraits(species: species, size: size, ears: ears, snout: snout, tail: tail, pattern: pattern)
                                    if let problem = problem(in: VoxelPetBuilder.build(traits, accessory: accessory)) {
                                        failures.append("\(traits) + \(accessory): \(problem)")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        XCTAssertEqual(failures, [], "\(failures.count) combinations failed; first: \(failures.first ?? "-")")
    }

    func testEarShapesChangeTheSilhouette() {
        func ears(_ shape: PetTraits.Ears) -> (top: Int, headTop: Int, lowest: Int) {
            let model = VoxelPetBuilder.build(PetTraits(ears: shape))
            let ears = model.voxels[.ears]!.keys.map(\.y)
            return (ears.max()!, model.voxels[.head]!.keys.map(\.y).max()!, ears.min()!)
        }

        let pointy = ears(.pointy)
        let floppy = ears(.floppy)
        let folded = ears(.folded)
        XCTAssertGreaterThanOrEqual(pointy.top, pointy.headTop + 2)
        XCTAssertLessThan(floppy.lowest, floppy.headTop, "floppy ears hang down the side of the head")
        XCTAssertEqual(folded.top, folded.headTop + 1)
    }

    func testCatsAndDogsDiffer() {
        let dog = VoxelPetBuilder.build(PetTraits(species: .dog))
        let cat = VoxelPetBuilder.build(PetTraits(species: .cat))

        XCTAssertNotEqual(dog, cat)
        XCTAssertTrue(dog.voxels[.head]!.values.contains(.ink), "dogs have a dark nose")
        XCTAssertTrue(cat.voxels[.head]!.values.contains(.inner), "cats have a pink nose")
    }

    func testPatternsColourTheCoat() {
        func colors(_ pattern: PetTraits.Pattern, _ part: VoxelPart) -> [VoxelColor] {
            Array(VoxelPetBuilder.build(PetTraits(pattern: pattern)).voxels[part]!.values)
        }

        let solid = VoxelPart.allCases.flatMap { colors(.solid, $0) }
        XCTAssertFalse(solid.contains(.secondary))
        XCTAssertTrue(colors(.tuxedo, .body).contains(.secondary), "tuxedo has a light chest and belly")
        XCTAssertTrue(colors(.tuxedo, .frontLeftLeg).contains(.secondary), "tuxedo has white paws")
        XCTAssertTrue(colors(.points, .backRightLeg).allSatisfy { $0 == .secondary }, "points darken the legs")
        XCTAssertTrue(colors(.points, .ears).allSatisfy { $0 == .secondary || $0 == .inner }, "dark ears keep their pink inner")
    }

    func testAccessoriesAddVoxels() {
        let plain = VoxelPetBuilder.build(PetTraits())

        let collar = VoxelPetBuilder.build(PetTraits(), accessory: .starCollar)
        XCTAssertTrue(collar.voxels[.body]!.values.contains(.gold))
        XCTAssertEqual(collar.count, plain.count + 1, "the collar recolours the neck and adds one tag voxel")

        let hat = VoxelPetBuilder.build(PetTraits(), accessory: .partyHat)
        XCTAssertGreaterThan(hat.voxels[.head]!.keys.map(\.y).max()!, plain.voxels[.head]!.keys.map(\.y).max()!)
    }

    func testTraitsDecodeFromProviderJSON() throws {
        let json = #"{"species":"cat","size":"small","ears":"folded","snout":"short","tail":"bob","pattern":"tabby","primaryHex":"9CA3AF","secondaryHex":"4B5563","eyeHex":"F59E0B"}"#

        let traits = try JSONDecoder().decode(PetTraits.self, from: Data(json.utf8))

        XCTAssertEqual(traits, PetTraits(species: .cat, size: .small, ears: .folded, snout: .short, tail: .bob, pattern: .tabby, primaryHex: "9CA3AF", secondaryHex: "4B5563", eyeHex: "F59E0B"))
    }

    func testProfilesSavedBeforeTraitsStillDecode() throws {
        let legacy = #"{"id":"6F1B9A3E-1111-4C2B-9D3A-000000000001","name":"Mochi","style":"sunny","scene":"pixelGrove","appearance":{"color":"mint","accessory":"none"},"personality":{"playfulness":72,"curiosity":64,"affection":80},"state":{"mood":76,"energy":68,"bond":12},"createdAt":782000000}"#

        let profile = try JSONDecoder().decode(PetProfile.self, from: Data(legacy.utf8))

        XCTAssertNil(profile.traits)
        XCTAssertEqual(profile.resolvedTraits.primaryHex, "49B98C", "older pets take their coat colour from the appearance picker")

        var withTraits = profile
        withTraits.traits = PetTraits(species: .cat, pattern: .points)
        let decoded = try JSONDecoder().decode(PetProfile.self, from: JSONEncoder().encode(withTraits))
        XCTAssertEqual(decoded.traits, withTraits.traits)
    }

    func testNoiseIsStableAcrossPlatforms() {
        // Pinned so a web renderer can reproduce the same spot pattern.
        XCTAssertEqual(VoxelPetBuilder.noise(1, 2, 3), 147_163_718)
        XCTAssertEqual(VoxelPetBuilder.noise(-4, 7, -2), 276_490_823)
    }

    /// Returns why a model would render badly, or nil if it is sound.
    private func problem(in model: VoxelPetModel) -> String? {
        guard Set(model.voxels.keys) == Set(VoxelPart.allCases) else { return "missing parts" }
        var owner: [VoxelPosition: VoxelPart] = [:]
        for (part, voxels) in model.voxels {
            guard !voxels.isEmpty, model.pivots[part] != nil else { return "\(part) is empty or has no pivot" }
            for position in voxels.keys {
                // Two parts sharing a voxel would z-fight when rendered.
                if let other = owner.updateValue(part, forKey: position) {
                    return "\(part) and \(other) overlap at \(position)"
                }
            }
        }
        return owner.keys.map(\.y).min() == 0 ? nil : "feet are not on the ground"
    }
}
