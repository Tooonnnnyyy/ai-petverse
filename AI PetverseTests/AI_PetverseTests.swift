import XCTest
import ImageIO
import UniformTypeIdentifiers
@testable import PetverseApp

private struct FailingGenerationService: AvatarGenerationService {
    func generate(request: AvatarGenerationRequest) async throws -> GeneratedAvatar {
        throw AvatarGenerationError.providerUnavailable
    }
}

final class AI_PetverseTests: XCTestCase {
    func testInteractionClampsAndUpdatesDeterministically() {
        var state = PetState(mood: 95, energy: 4, bond: 99, lastInteractionAt: nil)
        let date = Date(timeIntervalSince1970: 100)
        let reaction = state.interact(at: date)

        XCTAssertEqual(state.mood, 100)
        XCTAssertEqual(state.energy, 10)
        XCTAssertEqual(state.bond, 100)
        XCTAssertEqual(state.lastInteractionAt, date)
        XCTAssertEqual(reaction, "A gentle cuddle restored a little energy.")
    }

    func testProfileRoundTripsThroughCodable() throws {
        let profile = PetProfile(
            name: "Nori",
            style: .midnight,
            scene: .neonArcade,
            appearance: PetAppearance(color: "violet", accessory: "star collar"),
            personality: PetPersonality(playfulness: 40, curiosity: 90, affection: 55),
            state: PetState(mood: 50, energy: 60, bond: 8, lastInteractionAt: nil),
            sourceImageData: Data([1, 2, 3]),
            avatarImageData: Data([4, 5, 6])
        )
        let data = try JSONEncoder().encode(profile)
        let decoded = try JSONDecoder().decode(PetProfile.self, from: data)
        XCTAssertEqual(decoded, profile)
    }

    func testLocalRendererCreatesDistinctPixelPNGPerStyle() throws {
        let source = try makeFixturePNG(width: 96, height: 64)

        let sunny = try PixelAvatarRenderer.render(sourceImageData: source, style: .sunny)
        let midnight = try PixelAvatarRenderer.render(sourceImageData: source, style: .midnight)
        XCTAssertNotEqual(sunny, source)
        XCTAssertNotEqual(sunny, midnight)
        let sunnyDimensions = try imageDimensions(sunny)
        let midnightDimensions = try imageDimensions(midnight)
        XCTAssertEqual(sunnyDimensions.width, 576)
        XCTAssertEqual(sunnyDimensions.height, 576)
        XCTAssertEqual(midnightDimensions.width, 576)
        XCTAssertEqual(midnightDimensions.height, 576)
    }

    private func makeFixturePNG(width: Int, height: Int) throws -> Data {
        var pixels = [UInt8](repeating: 0, count: width * height * 4)
        for y in 0..<height {
            for x in 0..<width {
                let index = (y * width + x) * 4
                let isWhite = x >= 24 && x < 72 && y >= 16 && y < 48
                pixels[index] = isWhite ? 255 : 46
                pixels[index + 1] = isWhite ? 255 : 133
                pixels[index + 2] = isWhite ? 255 : 214
                pixels[index + 3] = 255
            }
        }
        guard let context = CGContext(
            data: &pixels,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ), let image = context.makeImage() else {
            throw AvatarGenerationError.providerUnavailable
        }
        let output = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(output, UTType.png.identifier as CFString, 1, nil) else {
            throw AvatarGenerationError.providerUnavailable
        }
        CGImageDestinationAddImage(destination, image, nil)
        guard CGImageDestinationFinalize(destination) else {
            throw AvatarGenerationError.providerUnavailable
        }
        return output as Data
    }

    private struct ImageDimensions {
        let width: Int
        let height: Int
    }

    private func imageDimensions(_ data: Data) throws -> ImageDimensions {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
            throw AvatarGenerationError.invalidSourceImage
        }
        return ImageDimensions(width: image.width, height: image.height)
    }

    func testLegacyProfileWithoutAvatarStillDecodes() throws {
        let profile = PetProfile.fallback
        let data = try JSONEncoder().encode(profile)
        var object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        object.removeValue(forKey: "avatarImageData")
        let legacyData = try JSONSerialization.data(withJSONObject: object)
        let decoded = try JSONDecoder().decode(PetProfile.self, from: legacyData)
        XCTAssertNil(decoded.avatarImageData)
    }

    func testLegacyProfileWithoutSceneDefaultsToPixelGrove() throws {
        let data = try JSONEncoder().encode(PetProfile.fallback)
        var object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        object.removeValue(forKey: "scene")
        let legacyData = try JSONSerialization.data(withJSONObject: object)
        XCTAssertEqual(try JSONDecoder().decode(PetProfile.self, from: legacyData).scene, .pixelGrove)
    }

    @MainActor
    func testSceneSelectionUpdatesAndPersistsOnSavedPet() {
        let suiteName = "AI_PetverseTests.scene-selection"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        let store = AppStore(persistence: LocalPetStore(defaults: defaults))

        store.useTemplate()
        store.continueToCustomize()
        store.savePet()
        XCTAssertEqual(store.pet?.scene, .pixelGrove)

        store.updateScene(.neonArcade)

        XCTAssertEqual(store.pet?.scene, .neonArcade)
        XCTAssertEqual(LocalPetStore(defaults: defaults).load()?.scene, .neonArcade)
    }

    func testLocalPetStoreSavesAndDeletes() {
        let defaults = UserDefaults(suiteName: "AI_PetverseTests.store")!
        defaults.removePersistentDomain(forName: "AI_PetverseTests.store")
        let store = LocalPetStore(defaults: defaults)
        let profile = PetProfile.fallback

        XCTAssertNil(store.load())
        store.save(profile)
        XCTAssertEqual(store.load(), profile)
        store.delete()
        XCTAssertNil(store.load())
    }

    @MainActor
    func testGenerationRequiresPhotoAndInteractionHasCooldown() {
        let suiteName = "AI_PetverseTests.behavior"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        let store = AppStore(persistence: LocalPetStore(defaults: defaults))

        store.startCreation()
        store.beginGeneration()
        XCTAssertEqual(store.screen, .photoInput)
        XCTAssertEqual(store.events.last, "generation_blocked_missing_photo")

        store.useTemplate()
        store.continueToCustomize()
        store.savePet()
        let firstDate = Date(timeIntervalSince1970: 100)
        store.performInteraction(at: firstDate)
        let firstBond = store.pet?.state.bond
        store.performInteraction(at: firstDate.addingTimeInterval(1))
        XCTAssertEqual(store.pet?.state.bond, firstBond)
        XCTAssertEqual(store.events.last, "pet_interaction_cooldown")
    }

    @MainActor
    func testPlayTogetherProducesVisiblePlayingStateAndCooldownFeedback() {
        let suiteName = "AI_PetverseTests.playing"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        let store = AppStore(persistence: LocalPetStore(defaults: defaults))
        store.startCreation()
        store.useTemplate()
        store.continueToCustomize()
        store.savePet()

        let date = Date(timeIntervalSince1970: 1_000)
        store.performInteraction(at: date)
        XCTAssertTrue(store.isPlaying)
        XCTAssertEqual(store.pet?.state.bond, 15)
        store.performInteraction(at: date.addingTimeInterval(1))
        XCTAssertTrue(store.isPlaying)
        XCTAssertEqual(store.pet?.state.bond, 15)
        XCTAssertEqual(store.events.last, "pet_interaction_cooldown")
    }

    @MainActor
    func testGenerationFailureReturnsToPhotoInput() async throws {
        let suiteName = "AI_PetverseTests.generation-failure"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        let store = AppStore(
            persistence: LocalPetStore(defaults: defaults),
            generationService: FailingGenerationService()
        )

        store.startCreation()
        store.selectPhoto(Data([1, 2, 3]))
        store.beginGeneration()
        for _ in 0..<10_000 where store.generationError == nil {
            await Task.yield()
        }

        XCTAssertEqual(store.screen, .photoInput)
        XCTAssertFalse(store.isGenerating)
        XCTAssertEqual(store.events.last, "generation_failed")
        XCTAssertNotNil(store.generationError)
    }

    @MainActor
    func testRetryFromPresetReturnsToPhotoInputWithGuidance() {
        let suiteName = "AI_PetverseTests.generation-retry"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        let store = AppStore(persistence: LocalPetStore(defaults: defaults))

        store.startCreation()
        store.useTemplate()
        store.retryGeneration()

        XCTAssertEqual(store.screen, .photoInput)
        XCTAssertEqual(store.events.last, "generation_retry_requires_photo")
        XCTAssertEqual(store.generationError, "Choose a pet photo to retry, or keep the preset template.")
    }
}
