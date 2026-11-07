import Foundation

enum Activity: String, CaseIterable, Codable, Hashable, Identifiable {
    case hiking
    case biking
    case swimming
    case snorkeling
    case scubaDiving
    case paddling
    case boating
    case fishing
    case camping
    case birding
    case wildlifeViewing
    case horsebackRiding
    case picnicking
    case beachcombing
    case history
    case tubing
    case caveTours
    case stargazing
    case photography

    var id: String { rawValue }

    var title: String {
        switch self {
        case .hiking: "Hiking"
        case .biking: "Biking"
        case .swimming: "Swimming"
        case .snorkeling: "Snorkeling"
        case .scubaDiving: "Scuba Diving"
        case .paddling: "Kayaking & Canoeing"
        case .boating: "Boating"
        case .fishing: "Fishing"
        case .camping: "Camping"
        case .birding: "Birding"
        case .wildlifeViewing: "Wildlife Viewing"
        case .horsebackRiding: "Horseback Riding"
        case .picnicking: "Picnicking"
        case .beachcombing: "Beachcombing"
        case .history: "History & Museums"
        case .tubing: "Tubing"
        case .caveTours: "Cave Tours"
        case .stargazing: "Stargazing"
        case .photography: "Photography"
        }
    }

    var systemImage: String {
        switch self {
        case .hiking: "figure.hiking"
        case .biking: "bicycle"
        case .swimming: "figure.pool.swim"
        case .snorkeling: "water.waves"
        case .scubaDiving: "figure.open.water.swim"
        case .paddling: "oar.2.crossed"
        case .boating: "sailboat"
        case .fishing: "fish"
        case .camping: "tent"
        case .birding: "bird"
        case .wildlifeViewing: "binoculars"
        case .horsebackRiding: "figure.equestrian.sports"
        case .picnicking: "fork.knife"
        case .beachcombing: "beach.umbrella"
        case .history: "building.columns"
        case .tubing: "lifepreserver"
        case .caveTours: "mountain.2"
        case .stargazing: "moon.stars"
        case .photography: "camera"
        }
    }
}
