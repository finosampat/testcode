import SwiftUI

struct StatsRowView: View {
    let park: Park
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        let layout = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: 12))
            : AnyLayout(HStackLayout(spacing: 12))

        layout {
            StatTile(
                value: park.acreage.formatted(.number),
                label: "Acres",
                systemImage: "map",
                tint: park.gradientColors.first ?? .accentColor
            )
            StatTile(
                value: String(park.establishedYear),
                label: "Established",
                systemImage: "calendar",
                tint: park.gradientColors.dropFirst().first ?? .accentColor
            )
            StatTile(
                value: park.activities.count.formatted(),
                label: park.activities.count == 1 ? "Activity" : "Activities",
                systemImage: "figure.walk",
                tint: park.gradientColors.last ?? .accentColor
            )
        }
    }
}

private struct StatTile: View {
    let value: String
    let label: String
    let systemImage: String
    let tint: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: systemImage)
                .font(.title3)
                .foregroundStyle(tint)
            Text(value)
                .font(.title3.bold().monospacedDigit())
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .padding(.horizontal, 8)
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    StatsRowView(park: Park.seed[0]).padding()
}
