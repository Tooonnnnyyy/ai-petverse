import XCTest
import UIKit
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
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 96, height: 64))
        let source = renderer.jpegData(withCompressionQuality: 0.9) { context in
            UIColor(red: 0.18, green: 0.52, blue: 0.84, alpha: 1).setFill()
            context.fill(CGRect(x: 0, y: 0, width: 96, height: 64))
            UIColor.white.setFill()
            context.fill(CGRect(x: 24, y: 16, width: 48, height: 32))
        }

        let sunny = try PixelAvatarRenderer.render(sourceImageData: source, style: .sunny)
        let midnight = try PixelAvatarRenderer.render(sourceImageData: source, style: .midnight)
        XCTAssertNotEqual(sunny, source)
        XCTAssertNotEqual(sunny, midnight)
        XCTAssertEqual(UIImage(data: sunny)?.size, CGSize(width: 576, height: 576))
        XCTAssertEqual(UIImage(data: midnight)?.size, CGSize(width: 576, height: 576))
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
