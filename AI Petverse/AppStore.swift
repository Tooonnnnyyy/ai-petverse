import Foundation
import SwiftUI

@MainActor
final class AppStore: ObservableObject {
    enum Screen {
        case onboarding, photoInput, generating, result, customize, home
    }

    @Published var screen: Screen = .onboarding
    @Published var pet: PetProfile?
    @Published var draft = PetDraft()
    @Published var generationError: String?
    @Published var reactionMessage: String?
    @Published var shareSheetPresented = false
    @Published var deleteConfirmationPresented = false
    @Published private(set) var isGenerating = false
    @Published private(set) var events: [String] = []

    private let persistence: LocalPetStore

    init(persistence: LocalPetStore = LocalPetStore()) {
        self.persistence = persistence
        pet = persistence.load()
        screen = pet == nil ? .onboarding : .home
    }

    func startCreation() {
        draft = PetDraft()
        generationError = nil
        reactionMessage = nil
        screen = .photoInput
        track("pet_creation_started")
    }

    func selectPhoto(_ data: Data) {
        draft.sourceImageData = data
        track("pet_photo_selected")
    }

    func beginGeneration() {
        generationError = nil
        isGenerating = true
        screen = .generating
        track("generation_requested")
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: .milliseconds(650))
            guard let self else { return }
            self.isGenerating = false
            self.screen = .result
            self.track("generation_succeeded")
        }
    }

    func useTemplate() {
        draft.sourceImageData = nil
        generationError = nil
        isGenerating = false
        screen = .result
        track("generation_fallback_used")
    }

    func retryGeneration() {
        beginGeneration()
    }

    func continueToCustomize() {
        screen = .customize
    }

    func savePet() {
        let profile = draft.makeProfile()
        pet = profile
        persistence.save(profile)
        screen = .home
        track("pet_saved")
    }

    func performInteraction() {
        guard var profile = pet else { return }
        reactionMessage = profile.state.interact()
        pet = profile
        persistence.save(profile)
        track("pet_interaction_completed")
    }

    func openShareSheet() {
        shareSheetPresented = true
        track("share_sheet_opened")
    }

    func deletePet() {
        persistence.delete()
        pet = nil
        draft = PetDraft()
        reactionMessage = nil
        deleteConfirmationPresented = false
        screen = .onboarding
        track("data_delete_requested")
    }

    private func track(_ event: String) {
        events.append(event)
    }
}
