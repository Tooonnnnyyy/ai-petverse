import Foundation

struct PetAppearance: Codable, Equatable {
    var color: String = "sunset"
    var accessory: String = "none"
}

struct PetPersonality: Codable, Equatable {
    var playfulness: Int = 72
    var curiosity: Int = 64
    var affection: Int = 80
}

struct PetState: Codable, Equatable {
    var mood: Int = 76
    var energy: Int = 68
    var bond: Int = 12
    var lastInteractionAt: Date?

    mutating func interact(at date: Date = Date()) -> String {
        let energyBefore = energy
        mood = min(100, mood + 12)
        energy = max(0, energy - 6)
        bond = min(100, bond + 3)
        lastInteractionAt = date
        if energyBefore < 24 {
            energy = min(100, energy + 10)
            return "A gentle cuddle restored a little energy."
        }
        return "Zoomies unlocked — your bond grew stronger."
    }
}

struct PetProfile: Codable, Equatable, Identifiable {
    var id: UUID = UUID()
    var name: String
    var style: PetStyle
    var appearance: PetAppearance
    var personality: PetPersonality
    var state: PetState
    var sourceImageData: Data?
    /// The locally rendered pixel avatar. Kept separate from the original so the
    /// product never presents the uploaded photo as a generated result.
    var avatarImageData: Data?
    var createdAt: Date = Date()

    static var fallback: PetProfile {
        PetProfile(
            name: "Mochi",
            style: .sunny,
            appearance: PetAppearance(),
            personality: PetPersonality(),
            state: PetState(),
            sourceImageData: nil,
            avatarImageData: nil
        )
    }

    enum CodingKeys: String, CodingKey {
        case id, name, style, appearance, personality, state, sourceImageData, avatarImageData, createdAt
    }

    init(
        id: UUID = UUID(),
        name: String,
        style: PetStyle,
        appearance: PetAppearance,
        personality: PetPersonality,
        state: PetState,
        sourceImageData: Data?,
        avatarImageData: Data? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.style = style
        self.appearance = appearance
        self.personality = personality
        self.state = state
        self.sourceImageData = sourceImageData
        self.avatarImageData = avatarImageData
        self.createdAt = createdAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        style = try container.decode(PetStyle.self, forKey: .style)
        appearance = try container.decode(PetAppearance.self, forKey: .appearance)
        personality = try container.decode(PetPersonality.self, forKey: .personality)
        state = try container.decode(PetState.self, forKey: .state)
        sourceImageData = try container.decodeIfPresent(Data.self, forKey: .sourceImageData)
        avatarImageData = try container.decodeIfPresent(Data.self, forKey: .avatarImageData)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
    }
}

enum PetStyle: String, CaseIterable, Codable, Identifiable, Sendable {
    case sunny
    case midnight
    case candy

    var id: String { rawValue }

    var title: String {
        switch self {
        case .sunny: return "Pixel Grove"
        case .midnight: return "Neon Night"
        case .candy: return "Candy Arcade"
        }
    }

    var subtitle: String {
        switch self {
        case .sunny: return "Warm farm-day glow"
        case .midnight: return "Cosmic arcade calm"
        case .candy: return "Y2K sparkle pop"
        }
    }

    var emoji: String {
        switch self {
        case .sunny: return "🐶"
        case .midnight: return "🐈‍⬛"
        case .candy: return "🐰"
        }
    }

    var accentHex: String {
        switch self {
        case .sunny: return "F59E0B"
        case .midnight: return "8B5CF6"
        case .candy: return "EC4899"
        }
    }
}

struct PetDraft: Equatable {
    var name: String = "Mochi"
    var style: PetStyle = .sunny
    var appearance = PetAppearance()
    var personality = PetPersonality()
    var sourceImageData: Data?
    var avatarImageData: Data?

    init(profile: PetProfile? = nil) {
        guard let profile else { return }
        name = profile.name
        style = profile.style
        appearance = profile.appearance
        personality = profile.personality
        sourceImageData = profile.sourceImageData
        avatarImageData = profile.avatarImageData
    }

    func makeProfile() -> PetProfile {
        PetProfile(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Mochi" : name,
            style: style,
            appearance: appearance,
            personality: personality,
            state: PetState(),
            sourceImageData: sourceImageData,
            avatarImageData: avatarImageData
        )
    }
}

struct LocalPetStore {
    private let defaults: UserDefaults
    private let profileKey = "ai-petverse.profile.v1"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func load() -> PetProfile? {
        guard let data = defaults.data(forKey: profileKey) else { return nil }
        return try? JSONDecoder().decode(PetProfile.self, from: data)
    }

    func save(_ profile: PetProfile) {
        guard let data = try? JSONEncoder().encode(profile) else { return }
        defaults.set(data, forKey: profileKey)
    }

    func delete() {
        defaults.removeObject(forKey: profileKey)
    }
}
