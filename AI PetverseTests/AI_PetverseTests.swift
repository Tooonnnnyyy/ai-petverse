import XCTest
@testable import PetverseApp

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
            sourceImageData: Data([1, 2, 3])
        )
        let data = try JSONEncoder().encode(profile)
        let decoded = try JSONDecoder().decode(PetProfile.self, from: data)
        XCTAssertEqual(decoded, profile)
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
}
