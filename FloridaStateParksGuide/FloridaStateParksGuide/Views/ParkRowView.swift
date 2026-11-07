import SwiftUI

struct ParkRowView: View {
    let park: Park
    @ScaledMetric(relativeTo: .headline) private var badgeSize: CGFloat = 44

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(park.gradient)
                .frame(width: badgeSize, height: badgeSize)
                .overlay {
                    Image(systemName: park.headerSymbol)
                        .font(.headline)
                        .foregroundStyle(.white)
                        .shadow(radius: 2)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(park.name)
                    .font(.headline)
                Text("\(park.region.rawValue) · Est. \(String(park.establishedYear))")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)

            if park.isFavorite {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.pink)
                    .transition(.scale.combined(with: .opacity))
                    .accessibilityLabel("Favorite")
            }
        }
        .padding(.vertical, 4)
        .animation(.spring(duration: 0.3), value: park.isFavorite)
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    List {
        ParkRowView(park: Park.seed[0])
        ParkRowView(park: Park.seed[1])
    }
}
