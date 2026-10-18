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
    private let generationService: any AvatarGenerationService
    private var generationTask: Task<Void, Never>?
    private var photoLoadTask: Task<Void, Never>?
    private var generationID: UUID?
    private var photoLoadID: UUID?

    init(
        persistence: LocalPetStore = LocalPetStore(),
        generationService: any AvatarGenerationService = LocalPreviewAvatarGenerationService()
    ) {
        self.persistence = persistence
        self.generationService = generationService
        pet = persistence.load()
        screen = pet == nil ? .onboarding : .home
    }

    func startCreation() {
        generationTask?.cancel()
        photoLoadTask?.cancel()
        photoLoadID = nil
        generationID = nil
        isGenerating = false
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
        generationTask?.cancel()
        photoLoadTask?.cancel()
        photoLoadID = nil
        generationID = nil
        isGenerating = false
        draft.sourceImageData = data
        draft.avatarImageData = nil
        photoError = nil
        generationError = nil
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
        guard let sourceImageData = draft.sourceImageData, !sourceImageData.isEmpty else {
            generationError = "Choose a pet photo first, or use the preset template below."
            track("generation_blocked_missing_photo")
            return
        }
        generationTask?.cancel()
        let requestID = UUID()
        generationID = requestID
        generationError = nil
        isGenerating = true
        screen = .generating
        track("generation_requested")
        let request = AvatarGenerationRequest(sourceImageData: sourceImageData, style: draft.style)
        let service = generationService
        let task = Task { @MainActor [weak self] in
            do {
                let avatar = try await service.generate(request: request)
                try Task.checkCancellation()
                guard let self, self.isGenerating, self.generationID == requestID else { return }
                self.draft.sourceImageData = avatar.sourceImageData
                self.draft.avatarImageData = avatar.avatarImageData
                self.isGenerating = false
                self.generationID = nil
                self.screen = .result
                self.track("generation_succeeded")
            } catch {
                guard let self, self.isGenerating, self.generationID == requestID else { return }
                if error is CancellationError { return }
                self.isGenerating = false
                self.generationID = nil
                self.generationError = "We couldn't make that preview. Try again or use a preset template."
                self.screen = .photoInput
                self.track("generation_failed")
                return
            }
        }
        generationTask = task
    }

    func useTemplate() {
        generationTask?.cancel()
        generationID = nil
        draft.sourceImageData = nil
        draft.avatarImageData = nil
        selectedPhotoItem = nil
        selectedPhotoImage = nil
        generationError = nil
        isGenerating = false
        screen = .result
        track("generation_fallback_used")
    }

    func retryGeneration() {
        guard draft.sourceImageData != nil else {
            generationError = "Choose a pet photo to retry, or keep the preset template."
            screen = .photoInput
            track("generation_retry_requires_photo")
            return
        }
        beginGeneration()
    }

    func updateStyle(_ style: PetStyle) {
        draft.style = style
        guard let source = draft.sourceImageData else { return }
        let requestID = UUID()
        generationID = requestID
        generationTask?.cancel()
        let service = generationService
        generationTask = Task { @MainActor [weak self] in
            do {
                let avatar = try await service.generate(request: AvatarGenerationRequest(sourceImageData: source, style: style))
                try Task.checkCancellation()
                guard let self, self.generationID == requestID else { return }
                self.draft.avatarImageData = avatar.avatarImageData
                self.generationID = nil
            } catch is CancellationError {
                return
            } catch {
                // A style switch should never erase a working avatar; retain the
                // previous preview if a rerender is unavailable.
                guard let self, self.generationID == requestID else { return }
                self.generationID = nil
            }
        }
    }

    func loadPhoto(from item: PhotosPickerItem) {
        photoLoadTask?.cancel()
        let requestID = UUID()
        photoLoadID = requestID
        photoLoadTask = Task { @MainActor [weak self] in
            do {
                guard let data = try await item.loadTransferable(type: Data.self),
                      let uiImage = UIImage(data: data),
                      let compressed = uiImage.jpegData(compressionQuality: 0.78) else {
                    guard let self, self.photoLoadID == requestID else { return }
                    self.reportPhotoError("That image could not be read. Try another photo.")
                    return
                }
                try Task.checkCancellation()
                guard let self, requestID == self.photoLoadID else { return }
                self.selectPhoto(compressed, preview: Image(uiImage: uiImage))
            } catch is CancellationError {
                return
            } catch {
                guard let self, self.photoLoadID == requestID else { return }
                self.reportPhotoError("That image could not be read. Try another photo.")
            }
        }
    }

    func continueToCustomize() {
        screen = .customize
    }

    func savePet() {
        generationTask?.cancel()
        generationID = nil
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
        photoLoadTask?.cancel()
        photoLoadID = nil
        generationID = nil
        isGenerating = false
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
