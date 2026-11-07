import Observation
import SwiftUI

@Observable
final class ParksViewModel {
    static let favoritesKey = "favoriteParkIDs"

    private(set) var parks: [Park]
    var searchText = ""
    var showFavoritesOnly = false
    var selectedParkID: Park.ID?

    @ObservationIgnored
    @AppStorage(ParksViewModel.favoritesKey) private var storedFavoriteIDs = ""

    init(parks: [Park] = Park.seed, store: UserDefaults = .standard) {
        _storedFavoriteIDs = AppStorage(wrappedValue: "", Self.favoritesKey, store: store)
        let favorites = Self.decode(store.string(forKey: Self.favoritesKey) ?? "")
        self.parks = parks
            .map { park in
                var park = park
                park.isFavorite = favorites.contains(park.id)
                return park
            }
            .sorted { $0.name < $1.name }
    }

    // MARK: Queries

    var filteredParks: [Park] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        return parks.filter { park in
            (!showFavoritesOnly || park.isFavorite) && (query.isEmpty || Self.park(park, matches: query))
        }
    }

    /// Filtered parks grouped by region, in the order regions are declared.
    var sections: [ParkSection] {
        let grouped = Dictionary(grouping: filteredParks, by: \.region)
        return Region.allCases.compactMap { region in
            guard let parks = grouped[region], !parks.isEmpty else { return nil }
            return ParkSection(region: region, parks: parks)
        }
    }

    var favoriteCount: Int { parks.filter(\.isFavorite).count }

    func park(withID id: Park.ID?) -> Park? {
        guard let id else { return nil }
        return parks.first { $0.id == id }
    }

    // MARK: Intents

    func toggleFavorite(_ park: Park) {
        guard let index = parks.firstIndex(where: { $0.id == park.id }) else { return }
        parks[index].isFavorite.toggle()
        storedFavoriteIDs = Self.encode(Set(parks.filter(\.isFavorite).map(\.id)))
    }

    // MARK: Helpers

    private static func park(_ park: Park, matches query: String) -> Bool {
        park.name.localizedCaseInsensitiveContains(query)
            || park.region.rawValue.localizedCaseInsensitiveContains(query)
            || park.activities.contains { $0.title.localizedCaseInsensitiveContains(query) }
    }

    private static func decode(_ raw: String) -> Set<String> {
        Set(raw.split(separator: ",").map(String.init))
    }

    private static func encode(_ ids: Set<String>) -> String {
        ids.sorted().joined(separator: ",")
    }
}

struct ParkSection: Identifiable {
    let region: Region
    let parks: [Park]

    var id: Region { region }
}
