import SwiftUI
import PhotosUI

struct ContentView: View {
    @ObservedObject var store: AppStore

    var body: some View {
        Group {
            switch store.screen {
            case .onboarding: OnboardingView(store: store)
            case .photoInput: PhotoInputView(store: store)
            case .generating: GeneratingView(store: store)
            case .result: ResultView(store: store)
            case .customize: CustomizeView(store: store)
            case .home: HomeView(store: store)
            }
        }
        .tint(PetverseTheme.ink)
    }
}

struct OnboardingView: View {
    @ObservedObject var store: AppStore

    var body: some View {
        ZStack {
            SoftBackground(accent: Color(hex: "E6DEFF"))
            VStack(alignment: .leading, spacing: 0) {
                BrandMark()
                Spacer(minLength: 34)
                Text("Your pet,\nwith a little more magic.")
                    .font(.system(size: 43, weight: .bold, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Turn one favorite photo into a tiny digital companion you can shape, play with, and share.")
                    .font(.system(size: 17, weight: .regular, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink.opacity(0.66))
                    .lineSpacing(4)
                    .padding(.top, 18)
                Spacer()
                VStack(alignment: .leading, spacing: 15) {
                    FeatureLine(icon: "sparkles", text: "A stylized portrait made on your device")
                    FeatureLine(icon: "slider.horizontal.3", text: "A few choices to make it feel like yours")
                    FeatureLine(icon: "heart.fill", text: "A light daily loop, with no account required")
                }
                .padding(.bottom, 26)
                PrimaryButton(title: "Create my pet", systemImage: "arrow.right") { store.startCreation() }
                Text("Your photo stays on this device in this prototype.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink.opacity(0.48))
                    .frame(maxWidth: .infinity)
                    .padding(.top, 13)
            }
            .padding(.horizontal, 26)
            .padding(.vertical, 24)
        }
    }
}

struct FeatureLine: View {
    let icon: String
    let text: String
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon).foregroundStyle(PetverseTheme.coral).frame(width: 20)
            Text(text).font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.78))
        }
    }
}

struct PhotoInputView: View {
    @ObservedObject var store: AppStore

    var body: some View {
        ZStack {
            SoftBackground(accent: Color(hex: "DDF7EE"))
            VStack(alignment: .leading, spacing: 0) {
                StepHeader(step: "01", title: "Start with a favorite photo", subtitle: "Pick one clear photo. We will use it only for this local prototype preview.")
                Spacer(minLength: 28)
                ZStack {
                    RoundedRectangle(cornerRadius: 28, style: .continuous).fill(.white.opacity(0.72))
                    if let selectedImage = store.selectedPhotoImage {
                        selectedImage.resizable().scaledToFill().clipShape(RoundedRectangle(cornerRadius: 24))
                    } else {
                        VStack(spacing: 12) {
                            Image(systemName: "photo.badge.plus").font(.system(size: 34, weight: .medium)).foregroundStyle(PetverseTheme.coral)
                            Text("No photo selected").font(.system(size: 17, weight: .semibold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                            Text("A preset template is always available.").font(.system(size: 13, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.54))
                        }
                    }
                }
                .frame(height: 280)
                .clipped()
                .overlay(RoundedRectangle(cornerRadius: 28).stroke(PetverseTheme.ink.opacity(0.08)))
                Spacer()
                PhotosPicker(selection: $store.selectedPhotoItem, matching: .images) {
                    Label("Choose from photo library", systemImage: "photo.on.rectangle")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(PetverseTheme.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 17))
                }
                .onChange(of: store.selectedPhotoItem) { _, item in
                    Task {
                        guard let item else { return }
                        guard let data = try? await item.loadTransferable(type: Data.self) else { return }
                        guard let uiImage = UIImage(data: data), let compressed = uiImage.jpegData(compressionQuality: 0.78) else { return }
                        store.selectedPhotoImage = Image(uiImage: uiImage)
                        store.selectPhoto(compressed)
                    }
                }
                .buttonStyle(.plain)
                PrimaryButton(title: "Preview my pet", systemImage: "sparkles") { store.beginGeneration() }
                    .padding(.top, 12)
                Button("Use a preset template") { store.useTemplate() }
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink.opacity(0.62))
                    .frame(maxWidth: .infinity)
                    .padding(.top, 14)
            }
            .padding(26)
        }
    }
}

struct StepHeader: View {
    let step: String
    let title: String
    let subtitle: String
    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            Text("STEP \(step)").font(.system(size: 12, weight: .bold, design: .rounded)).tracking(1.4).foregroundStyle(PetverseTheme.coral)
            Text(title).font(.system(size: 31, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
            Text(subtitle).font(.system(size: 15, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.62)).lineSpacing(3)
        }
    }
}

struct GeneratingView: View {
    @ObservedObject var store: AppStore
    var body: some View {
        ZStack {
            SoftBackground(accent: Color(hex: "E6DEFF"))
            VStack(spacing: 24) {
                ProgressView().controlSize(.large).tint(PetverseTheme.coral)
                Text("Adding a little personality…").font(.system(size: 24, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                Text("This is a local preview while the AI generation provider is evaluated.").multilineTextAlignment(.center).font(.system(size: 14, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.58)).padding(.horizontal, 22)
                Button("Use preset now") { store.useTemplate() }.font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.62))
            }
            .padding(28)
        }
    }
}

struct ResultView: View {
    @ObservedObject var store: AppStore
    var body: some View {
        ZStack {
            SoftBackground(accent: Color(hex: store.draft.style.accentHex).opacity(0.35))
            VStack(alignment: .leading, spacing: 0) {
                StepHeader(step: "02", title: "Meet your first version", subtitle: "A playful starting point. You can tune the mood before saving.")
                Spacer(minLength: 26)
                VStack(spacing: 16) {
                    PetAvatar(style: store.draft.style, imageData: store.draft.sourceImageData, size: 205)
                    Text(store.draft.style.title).font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                    Text("Local preview · no photo uploaded").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.48))
                }
                .frame(maxWidth: .infinity)
                Spacer()
                PrimaryButton(title: "Make it mine", systemImage: "slider.horizontal.3") { store.continueToCustomize() }
                SecondaryButton(title: "Try again") { store.retryGeneration() }.padding(.top, 10)
            }
            .padding(26)
        }
    }
}

struct CustomizeView: View {
    @ObservedObject var store: AppStore
    var body: some View {
        ZStack {
            SoftBackground(accent: Color(hex: store.draft.style.accentHex).opacity(0.28))
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    StepHeader(step: "03", title: "Give them a point of view", subtitle: "Small choices make the character feel personal.")
                    HStack {
                        PetAvatar(style: store.draft.style, imageData: store.draft.sourceImageData, size: 116)
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Style preview").font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.54))
                            Text(store.draft.style.title).font(.system(size: 21, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        }
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Name").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        TextField("Pet name", text: $store.draft.name).textFieldStyle(.plain).font(.system(size: 17, weight: .semibold, design: .rounded)).padding(15).background(.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 15))
                    }
                    VStack(alignment: .leading, spacing: 11) {
                        Text("Visual mood").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        ForEach(PetStyle.allCases) { style in
                            Button { store.draft.style = style } label: {
                                HStack(spacing: 13) {
                                    Text(style.emoji).font(.system(size: 24))
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(style.title).font(.system(size: 15, weight: .semibold, design: .rounded))
                                        Text(style.subtitle).font(.system(size: 12, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.52))
                                    }
                                    Spacer()
                                    Image(systemName: store.draft.style == style ? "checkmark.circle.fill" : "circle").foregroundStyle(store.draft.style == style ? PetverseTheme.coral : PetverseTheme.ink.opacity(0.2))
                                }
                                .foregroundStyle(PetverseTheme.ink)
                                .padding(13)
                                .background(.white.opacity(store.draft.style == style ? 0.9 : 0.55), in: RoundedRectangle(cornerRadius: 16))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    VStack(alignment: .leading, spacing: 11) {
                        Text("Personality").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        PersonalitySlider(title: "Playful", value: $store.draft.personality.playfulness, tint: PetverseTheme.coral)
                        PersonalitySlider(title: "Curious", value: $store.draft.personality.curiosity, tint: Color(hex: "7C6CF2"))
                        PersonalitySlider(title: "Affectionate", value: $store.draft.personality.affection, tint: Color(hex: "49B98C"))
                    }
                    PrimaryButton(title: "Save my pet", systemImage: "heart.fill") { store.savePet() }
                }
                .padding(26)
            }
        }
    }
}

struct PersonalitySlider: View {
    let title: String
    @Binding var value: Int
    let tint: Color
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack { Text(title).font(.system(size: 13, weight: .medium, design: .rounded)); Spacer(); Text("\(value)").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.52)) }
            Slider(value: Binding(get: { Double(value) }, set: { value = Int($0) }), in: 0...100).tint(tint)
        }
    }
}

struct HomeView: View {
    @ObservedObject var store: AppStore
    var profile: PetProfile? { store.pet }

    var body: some View {
        ZStack {
            SoftBackground(accent: Color(hex: profile?.style.accentHex ?? "E6DEFF").opacity(0.34))
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack { BrandMark(); Spacer(); Button { store.deleteConfirmationPresented = true } label: { Image(systemName: "ellipsis").font(.system(size: 18, weight: .bold)).foregroundStyle(PetverseTheme.ink.opacity(0.7)).padding(10) } }
                    if let profile {
                        Text("Your little world").font(.system(size: 34, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        Text("A quiet moment with \(profile.name).").font(.system(size: 15, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.58))
                        VStack(spacing: 12) {
                            PetAvatar(style: profile.style, imageData: profile.sourceImageData, size: 186)
                            Text(profile.name).font(.system(size: 26, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                            Text(profile.style.title).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(PetverseTheme.coral)
                        }
                        .frame(maxWidth: .infinity)
                        VStack(spacing: 15) {
                            StatBar(title: "Mood", value: profile.state.mood, color: PetverseTheme.coral)
                            StatBar(title: "Energy", value: profile.state.energy, color: Color(hex: "F5B942"))
                            StatBar(title: "Bond", value: profile.state.bond, color: Color(hex: "49B98C"))
                        }
                        .padding(18)
                        .background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 21))
                        if let reaction = store.reactionMessage {
                            Text(reaction).font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(PetverseTheme.ink).padding(14).frame(maxWidth: .infinity, alignment: .leading).background(PetverseTheme.mint, in: RoundedRectangle(cornerRadius: 16))
                        }
                        PrimaryButton(title: "Play together", systemImage: "sparkles", tint: PetverseTheme.coral) { store.performInteraction() }
                        SecondaryButton(title: "Save or share portrait") { store.openShareSheet() }
                        Text("Share sheet opened ≠ published externally. You choose what happens next.").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.44)).frame(maxWidth: .infinity).multilineTextAlignment(.center)
                    }
                }
                .padding(26)
            }
        }
        .sheet(isPresented: $store.shareSheetPresented) {
            ShareSheet(items: [shareText])
        }
        .confirmationDialog("Delete this local pet?", isPresented: $store.deleteConfirmationPresented) {
            Button("Delete", role: .destructive) { store.deletePet() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This removes the saved profile and source photo from this prototype device.")
        }
    }

    private var shareText: String {
        guard let profile else { return "My AI Petverse companion" }
        return "Meet \(profile.name), my \(profile.style.title) companion in AI Petverse ✦"
    }
}

