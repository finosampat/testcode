# Florida State Parks Guide (iOS)

Universal SwiftUI app for iPhone and iPad (iOS 17+) that lets you browse real Florida state parks and save favorites.

## Features

- **Adaptive navigation**: on regular width (iPad) it uses a `NavigationSplitView` with a searchable sidebar and a detail column. On compact width (iPhone) it uses a `NavigationStack` list that pushes the detail view.
- **21 seeded parks** (`Models/Park+Seed.swift`), grouped by region. You can search by park name, region or activity, and filter to favorites only.
- **Detail view** with a unique gradient header for each park, a stats row (acreage, year established, activity count), an animated favorite button (symbol bounce/replace, spring scale, haptic), a description, and a grid of activities with SF Symbols.
- **Favorites persist** through `@AppStorage`, wrapped by the `@Observable` `ParksViewModel`.
- **Dark mode** uses semantic system colors. **Dynamic Type** uses text styles and `@ScaledMetric`, and the stats row stacks vertically at accessibility sizes.

## Layout

```
FloridaStateParksGuide/
  FloridaStateParksGuideApp.swift
  Models/        Park, Region, Activity, seed data
  ViewModels/    ParksViewModel (@Observable)
  Views/         ContentView (size-class switch), ParkListView, ParkRowView,
                 ParkDetailView, GradientHeaderView, StatsRowView,
                 FavoriteButton, ActivitiesSectionView
  Utilities/     Color+Hex
FloridaStateParksGuideTests/     view model unit tests
FloridaStateParksGuideUITests/   navigation + favorite toggling UI test
```

## Build & run

Requires Xcode 15 or later.

```sh
open FloridaStateParksGuide.xcodeproj   # then pick an iPhone or iPad simulator and Run

# or from the command line
xcodebuild -project FloridaStateParksGuide.xcodeproj -scheme FloridaStateParksGuide \
  -destination 'platform=iOS Simulator,name=iPhone 15' test
```

The UI test launches the app with `-resetFavorites` so each run starts with no favorites.

Park acreage and establishment years are approximate and come from public Florida State Parks information.
