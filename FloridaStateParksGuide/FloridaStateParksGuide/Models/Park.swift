import SwiftUI

struct Park: Identifiable, Hashable {
    let id: String
    let name: String
    let region: Region
    let description: String
    let establishedYear: Int
    let acreage: Int
    let activities: [Activity]
    var isFavorite: Bool = false

    /// Hex colors (0xRRGGBB) used to build this park's unique header gradient.
    let gradientHex: [UInt32]
    /// SF Symbol shown as a watermark in the header.
    let headerSymbol: String

    var gradientColors: [Color] { gradientHex.map(Color.init(hex:)) }

    var gradient: LinearGradient {
        LinearGradient(colors: gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}
