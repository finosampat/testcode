import Foundation

enum Region: String, CaseIterable, Codable, Hashable, Identifiable {
    case panhandle = "Panhandle"
    case northeast = "Northeast"
    case northCentral = "North Central"
    case central = "Central"
    case westCentral = "West Central"
    case southwest = "Southwest"
    case southeast = "Southeast"
    case keys = "Florida Keys"

    var id: String { rawValue }

    var systemImage: String {
        switch self {
        case .panhandle: "sun.horizon"
        case .northeast: "building.columns"
        case .northCentral: "drop"
        case .central: "leaf"
        case .westCentral: "sunset"
        case .southwest: "tree"
        case .southeast: "water.waves"
        case .keys: "fish"
        }
    }
}
