import UIKit
import XCTest

/// Drives navigation and favorite toggling. Short pauses keep the flow readable in screen recordings.
final class ParkNavigationUITests: XCTestCase {
    private var app: XCUIApplication!
    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        if UIDevice.current.userInterfaceIdiom == .pad {
            XCUIDevice.shared.orientation = .landscapeLeft
        }
        app = XCUIApplication()
        app.launchArguments = ["-resetFavorites"]
        app.launch()
    }

    func testNavigateAndToggleFavorites() {
        openPark("parkRow.grayton-beach", named: "Grayton Beach State Park")
        toggleFavorite(expectFavorite: true)
        toggleFavorite(expectFavorite: false)
        toggleFavorite(expectFavorite: true)
        goBackIfNeeded()

        openPark("parkRow.torreya", named: "Torreya State Park")
        toggleFavorite(expectFavorite: true)
        goBackIfNeeded()

        let search = app.searchFields.firstMatch
        if !search.exists { app.swipeDown() }
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("Spring")
        pause()
        openPark("parkRow.blue-spring", named: "Blue Spring State Park")
        toggleFavorite(expectFavorite: true)
        goBackIfNeeded()

        if app.buttons["Cancel"].exists { app.buttons["Cancel"].tap() }
        pause()

        let filter = app.buttons["favoritesFilter"]
        XCTAssertTrue(filter.waitForExistence(timeout: 5))
        filter.tap()
        pause(2)
        XCTAssertTrue(app.buttons["parkRow.grayton-beach"].exists)
        XCTAssertTrue(app.buttons["parkRow.torreya"].exists)
        XCTAssertTrue(app.buttons["parkRow.blue-spring"].exists)
        XCTAssertFalse(app.buttons["parkRow.anastasia"].exists)
        filter.tap()
        pause(2)
    }

    private func openPark(_ identifier: String, named name: String) {
        let row = app.buttons[identifier]
        XCTAssertTrue(row.waitForExistence(timeout: 5), "Missing row \(identifier)")
        row.tap()
        XCTAssertTrue(app.staticTexts[name].waitForExistence(timeout: 5))
        pause()
        app.scrollViews.firstMatch.swipeUp()
        pause()
        app.scrollViews.firstMatch.swipeDown()
        pause(0.5)
    }

    private func toggleFavorite(expectFavorite: Bool) {
        let button = app.buttons["favoriteButton"]
        XCTAssertTrue(button.waitForExistence(timeout: 5))
        button.tap()
        let expectedLabel = expectFavorite ? "Remove from Favorites" : "Add to Favorites"
        let predicate = NSPredicate(format: "label == %@", expectedLabel)
        let result = XCTWaiter.wait(for: [expectation(for: predicate, evaluatedWith: button)], timeout: 3)
        XCTAssertEqual(result, .completed)
        pause()
    }

    private func goBackIfNeeded() {
        guard !isPad else { return }
        app.navigationBars.buttons.element(boundBy: 0).tap()
        pause()
    }

    private func pause(_ seconds: TimeInterval = 1) {
        Thread.sleep(forTimeInterval: seconds)
    }
}
