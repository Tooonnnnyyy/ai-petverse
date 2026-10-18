import Foundation
import SwiftUI
import PhotosUI

@MainActor
final class AppStore: ObservableObject {
    enum Screen {
        case onboarding, photoInput, generating, result, customize, home
    }

    @Published var screen: Screen = .onboarding
    @Published var pet: PetProfile?
    @Published var draft = PetDraft()
    @Published var selectedPhotoItem: PhotosPickerItem?
    @Published var selectedPhotoImage: Image?
    @Published var cameraPresented = false
    @Published var photoError: String?
    @Published var generationError: String?
    @Published var reactionMessage: String?
    @Published var shareSheetPresented = false
    @Published var deleteConfirmationPresented = false
    @Published private(set) var isGenerating = false
    @Published private(set) var events: [String] = []

    private let persistence: LocalPetStore
    private var generationTask: Task<Void, Never>?

    init(persistence: LocalPetStore = LocalPetStore()) {
        self.persistence = persistence
        pet = persistence.load()
        screen = pet == nil ? .onboarding : .home
    }

    func startCreation() {
        generationTask?.cancel()
        draft = PetDraft()
        selectedPhotoItem = nil
        selectedPhotoImage = nil
        generationError = nil
        photoError = nil
        reactionMessage = nil
        screen = .photoInput
        track("pet_creation_started")
    }

    func selectPhoto(_ data: Data) {
        draft.sourceImageData = data
        photoError = nil
        track("pet_photo_selected")
    }

    func selectPhoto(_ data: Data, preview: Image) {
        selectedPhotoImage = preview
        selectPhoto(data)
    }

    func reportPhotoError(_ message: String) {
        photoError = message
    }

    func beginGeneration() {
        guard draft.sourceImageData != nil else {
            generationError = "Choose a pet photo first, or use the preset template below."
            track("generation_blocked_missing_photo")
            return
        }
        generationTask?.cancel()
        generationError = nil
        isGenerating = true
        screen = .generating
        track("generation_requested")
        let task = Task { @MainActor [weak self] in
            do {
                try await Task.sleep(for: .milliseconds(650))
            } catch {
                return
            }
            guard let self, self.isGenerating else { return }
            self.isGenerating = false
            self.screen = .result
            self.track("generation_succeeded")
        }
        generationTask = task
    }

    func useTemplate() {
        generationTask?.cancel()
        draft.sourceImageData = nil
        selectedPhotoItem = nil
        selectedPhotoImage = nil
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

    func performInteraction(at date: Date = Date()) {
        guard var profile = pet else { return }
        if let lastInteractionAt = profile.state.lastInteractionAt,
           date.timeIntervalSince(lastInteractionAt) < 5 {
            reactionMessage = "Your pet is still catching its breath — try again in a moment."
            track("pet_interaction_cooldown")
            return
        }
        reactionMessage = profile.state.interact(at: date)
        pet = profile
        persistence.save(profile)
        track("pet_interaction_completed")
    }

    func openShareSheet() {
        shareSheetPresented = true
        track("share_sheet_opened")
    }

    func deletePet() {
        generationTask?.cancel()
        persistence.delete()
        pet = nil
        draft = PetDraft()
        selectedPhotoItem = nil
        selectedPhotoImage = nil
        photoError = nil
        reactionMessage = nil
        deleteConfirmationPresented = false
        screen = .onboarding
        track("data_delete_requested")
    }

    private func track(_ event: String) {
        events.append(event)
    }
}
