import XCTest
@testable import FloridaStateParksGuide

final class ParksViewModelTests: XCTestCase {
    private var store: UserDefaults!
    private let suiteName = "ParksViewModelTests"

    override func setUp() {
        super.setUp()
        UserDefaults().removePersistentDomain(forName: suiteName)
        store = UserDefaults(suiteName: suiteName)
    }

    override func tearDown() {
        UserDefaults().removePersistentDomain(forName: suiteName)
        super.tearDown()
    }

    func testSeedHasAtLeastFifteenUniqueParks() {
        XCTAssertGreaterThanOrEqual(Park.seed.count, 15)
        XCTAssertEqual(Set(Park.seed.map(\.id)).count, Park.seed.count)
        XCTAssertTrue(Park.seed.allSatisfy { !$0.activities.isEmpty && $0.gradientHex.count >= 2 })
    }

    func testToggleFavoritePersistsAcrossInstances() throws {
        let viewModel = ParksViewModel(store: store)
        let park = try XCTUnwrap(viewModel.parks.first)
        XCTAssertFalse(park.isFavorite)

        viewModel.toggleFavorite(park)
        XCTAssertTrue(try XCTUnwrap(viewModel.park(withID: park.id)).isFavorite)

        let reloaded = ParksViewModel(store: store)
        XCTAssertTrue(try XCTUnwrap(reloaded.park(withID: park.id)).isFavorite)
        XCTAssertEqual(reloaded.favoriteCount, 1)

        reloaded.toggleFavorite(park)
        XCTAssertEqual(ParksViewModel(store: store).favoriteCount, 0)
    }

    func testSearchMatchesNameRegionAndActivity() {
        let viewModel = ParksViewModel(store: store)

        viewModel.searchText = "pennekamp"
        XCTAssertEqual(viewModel.filteredParks.map(\.id), ["john-pennekamp"])

        viewModel.searchText = "Florida Keys"
        XCTAssertTrue(viewModel.filteredParks.allSatisfy { $0.region == .keys })
        XCTAssertFalse(viewModel.filteredParks.isEmpty)

        viewModel.searchText = "cave tours"
        XCTAssertEqual(viewModel.filteredParks.map(\.id), ["florida-caverns"])
    }

    func testFavoritesOnlyFilterAndSectionsFollowRegionOrder() throws {
        let viewModel = ParksViewModel(store: store)
        viewModel.showFavoritesOnly = true
        XCTAssertTrue(viewModel.filteredParks.isEmpty)

        let park = try XCTUnwrap(viewModel.park(withID: "torreya"))
        viewModel.toggleFavorite(park)
        XCTAssertEqual(viewModel.filteredParks.map(\.id), ["torreya"])

        viewModel.showFavoritesOnly = false
        let regions = viewModel.sections.map(\.region)
        XCTAssertEqual(regions, Region.allCases.filter(regions.contains))
    }
}
