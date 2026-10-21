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
                    PixelPanel()
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
                HStack(spacing: 12) {
                    Button {
                        if UIImagePickerController.isSourceTypeAvailable(.camera) {
                            store.cameraPresented = true
                        } else {
                            store.reportPhotoError("Camera is unavailable here. Use the photo library or a preset template.")
                        }
                    } label: {
                        CaptureChoice(title: "Scan with camera", icon: "camera.fill", tint: PetverseTheme.coral)
                    }
                    PhotosPicker(selection: $store.selectedPhotoItem, matching: .images) {
                        CaptureChoice(title: "Upload photo", icon: "photo.on.rectangle", tint: PetverseTheme.purple)
                    }
                }
                .buttonStyle(.plain)
                .onChange(of: store.selectedPhotoItem) { _, item in
                    if let item { store.loadPhoto(from: item) }
                }
                .sheet(isPresented: $store.cameraPresented) {
                    CameraPicker { image in
                        store.cameraPresented = false
                        guard let compressed = image.jpegData(compressionQuality: 0.78) else {
                            store.reportPhotoError("The camera image could not be prepared. Try again.")
                            return
                        }
                        store.selectPhoto(compressed, preview: Image(uiImage: image))
                    } onCancel: {
                        store.cameraPresented = false
                    }
                }
                if let photoError = store.photoError {
                    Label(photoError, systemImage: "exclamationmark.triangle.fill")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(PetverseTheme.coral)
                        .padding(.top, 10)
                }
                if let generationError = store.generationError {
                    Label(generationError, systemImage: "exclamationmark.triangle.fill")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(PetverseTheme.coral)
                        .padding(.top, 10)
                }
                PrimaryButton(title: "Generate digital avatar", systemImage: "sparkles") { store.beginGeneration() }
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

struct CaptureChoice: View {
    let title: String
    let icon: String
    let tint: Color

    var body: some View {
        VStack(spacing: 9) {
            Image(systemName: icon).font(.system(size: 22, weight: .bold)).foregroundStyle(tint)
            Text(title).font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 15)
        .background(.white.opacity(0.86), in: RoundedRectangle(cornerRadius: 17, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 17).stroke(tint.opacity(0.28), lineWidth: 1.5))
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
                    VoxelWorldView(scene: store.draft.scene, traits: store.draft.resolvedTraits, accessory: PetAccessory(appearance: store.draft.appearance), isInteractive: false)
                        .frame(height: 300)
                        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
                    Text(store.draft.style.title).font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                    Text("Low-poly 3D world preview").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.48))
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
                        VoxelWorldView(scene: store.draft.scene, traits: store.draft.resolvedTraits, accessory: PetAccessory(appearance: store.draft.appearance), isInteractive: false)
                            .frame(width: 140, height: 140)
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        VStack(alignment: .leading, spacing: 6) {
                            Text("3D world preview").font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.54))
                            Text(store.draft.style.title).font(.system(size: 21, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        }
                    }
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Name").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        TextField("Pet name", text: $store.draft.name).textFieldStyle(.plain).font(.system(size: 17, weight: .semibold, design: .rounded)).padding(15).background(.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 15))
                    }
                    VStack(alignment: .leading, spacing: 11) {
                        Text("Scene").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        ForEach(PetScene.allCases) { scene in
                            SceneCard(scene: scene, isSelected: store.draft.scene == scene) { store.draft.scene = scene }
                        }
                    }
                    VStack(alignment: .leading, spacing: 11) {
                        Text("Visual mood").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        ForEach(PetStyle.allCases) { style in
                            Button { store.updateStyle(style) } label: {
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
                        Text("Avatar details").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(PetverseTheme.ink)
                        AppearancePicker(title: "Colour", values: [("sunset", "Sunset"), ("violet", "Violet"), ("mint", "Mint"), ("rose", "Rose")], selection: $store.draft.appearance.color)
                        AppearancePicker(title: "Accessory", values: [("none", "None"), ("star collar", "Star collar"), ("party hat", "Party hat"), ("flower", "Flower")], selection: $store.draft.appearance.accessory)
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

struct AppearancePicker: View {
    let title: String
    let values: [(String, String)]
    @Binding var selection: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(PetverseTheme.ink.opacity(0.62))
            Picker(title, selection: $selection) {
                ForEach(Array(values.enumerated()), id: \.offset) { _, value in Text(value.1).tag(value.0) }
            }
            .pickerStyle(.segmented)
        }
    }
}

struct HomeView: View {
    @ObservedObject var store: AppStore
    var profile: PetProfile? { store.pet }

    var body: some View {
        ZStack {
            if let profile {
                VoxelWorldView(scene: profile.scene, traits: profile.resolvedTraits, accessory: PetAccessory(appearance: profile.appearance), isPlaying: store.isPlaying)
                    .ignoresSafeArea()
                LinearGradient(
                    colors: [.black.opacity(0.32), .clear, .black.opacity(0.7)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                VStack(spacing: 0) {
                    immersiveTopBar(profile: profile)
                    Spacer()
                    VStack(spacing: 12) {
                        if let reaction = store.reactionMessage {
                            Text(reaction)
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(PetverseTheme.ink)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(.white.opacity(0.9), in: Capsule())
                                .transition(.move(edge: .bottom).combined(with: .opacity))
                        }
                        sceneSwitcher(selected: profile.scene)
                        ImmersiveStatsCard(profile: profile)
                        HStack(spacing: 10) {
                            Button { store.performInteraction() } label: {
                                Label("Play together", systemImage: "sparkles")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 15)
                                    .background(PetverseTheme.coral, in: Capsule())
                            }
                            .buttonStyle(.plain)
                            Button { store.openShareSheet() } label: {
                                Image(systemName: "square.and.arrow.up")
                                    .font(.system(size: 17, weight: .bold))
                                    .foregroundStyle(PetverseTheme.ink)
                                    .frame(width: 52, height: 52)
                                    .background(.white.opacity(0.9), in: Circle())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.bottom, 16)
                }
                .padding(.top, 8)
            } else {
                SoftBackground()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: store.reactionMessage)
        .sheet(isPresented: $store.shareSheetPresented) {
            ShareSheet(items: shareItems)
        }
        .confirmationDialog("Delete this local pet?", isPresented: $store.deleteConfirmationPresented) {
            Button("Delete", role: .destructive) { store.deletePet() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This removes the saved profile and source photo from this prototype device.")
        }
    }

    @ViewBuilder
    private func immersiveTopBar(profile: PetProfile) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(profile.name)
                    .font(.system(size: 25, weight: .bold, design: .rounded))
                Text("\(profile.scene.emoji)  \(profile.scene.title)")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .opacity(0.78)
            }
            .foregroundStyle(.white)
            Spacer()
            Button { store.deleteConfirmationPresented = true } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 42, height: 42)
                    .background(.black.opacity(0.25), in: Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 18)
    }

    private func sceneSwitcher(selected: PetScene) -> some View {
        HStack(spacing: 8) {
            ForEach(PetScene.allCases) { scene in
                Button { store.updateScene(scene) } label: {
                    HStack(spacing: 5) {
                        Text(scene.emoji)
                        Text(scene.title)
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                    }
                    .foregroundStyle(selected == scene ? PetverseTheme.ink : .white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(selected == scene ? .white : .black.opacity(0.25), in: Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var shareText: String {
        guard let profile else { return "My AI Petverse companion" }
        return "Meet \(profile.name), my \(profile.style.title) companion in AI Petverse ✦"
    }

    private var shareItems: [Any] {
        guard let image = renderedShareImage else { return [shareText] }
        return [image, shareText]
    }

    private var renderedShareImage: UIImage? {
        guard let profile else { return nil }
        let renderer = ImageRenderer(content: ShareCardView(profile: profile))
        renderer.scale = UIScreen.main.scale
        return renderer.uiImage
    }
}

struct ImmersiveStatsCard: View {
    let profile: PetProfile

    var body: some View {
        HStack(spacing: 14) {
            ImmersiveStat(title: "Mood", value: profile.state.mood, tint: PetverseTheme.coral)
            ImmersiveStat(title: "Energy", value: profile.state.energy, tint: Color(hex: "F5B942"))
            ImmersiveStat(title: "Bond", value: profile.state.bond, tint: Color(hex: "49B98C"))
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 13)
        .background(.black.opacity(0.3), in: RoundedRectangle(cornerRadius: 19, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 19, style: .continuous).stroke(.white.opacity(0.2)))
    }
}

struct ImmersiveStat: View {
    let title: String
    let value: Int
    let tint: Color

    var body: some View {
        VStack(spacing: 5) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(.white.opacity(0.75))
            Text("\(value)")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Capsule()
                .fill(.white.opacity(0.2))
                .frame(width: 62, height: 5)
                .overlay(alignment: .leading) {
                    Capsule().fill(tint).frame(width: 62 * CGFloat(value) / 100, height: 5)
                }
        }
        .frame(maxWidth: .infinity)
    }
}

struct ShareCardView: View {
    let profile: PetProfile

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: profile.style.accentHex).opacity(0.95), PetverseTheme.lavender],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            VStack(spacing: 18) {
                Text("petverse")
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink.opacity(0.65))
                PetAvatar(style: profile.style, imageData: profile.avatarImageData, appearance: profile.appearance, size: 190)
                Text(profile.name)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink)
                Text(profile.style.title)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink.opacity(0.68))
                Text("A little more magic for every day.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(PetverseTheme.ink.opacity(0.52))
            }
            .padding(28)
        }
        .frame(width: 360, height: 480)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
    }
}
