import SwiftUI

/// Colorful hero header built from the park's own gradient palette.
struct GradientHeaderView<Accessory: View>: View {
    let park: Park
    let accessory: Accessory

    @ScaledMetric(relativeTo: .largeTitle) private var minHeight: CGFloat = 240
    @ScaledMetric(relativeTo: .largeTitle) private var watermarkSize: CGFloat = 160

    init(park: Park, @ViewBuilder accessory: () -> Accessory) {
        self.park = park
        self.accessory = accessory()
    }

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            park.gradient

            // Soft highlights so every header has some depth.
            Circle()
                .fill(.white.opacity(0.18))
                .frame(width: watermarkSize * 1.6)
                .offset(x: -watermarkSize * 0.5, y: -watermarkSize * 0.8)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .blur(radius: 2)

            Image(systemName: park.headerSymbol)
                .font(.system(size: watermarkSize, weight: .bold))
                .foregroundStyle(.white.opacity(0.22))
                .rotationEffect(.degrees(-12))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                .padding(.top, 8)
                .padding(.trailing, -16)
                .accessibilityHidden(true)

            HStack(alignment: .bottom, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Label(park.region.rawValue, systemImage: park.region.systemImage)
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(.ultraThinMaterial, in: Capsule())
                        .environment(\.colorScheme, .dark)

                    Text(park.name)
                        .font(.largeTitle.bold())
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                }
                Spacer(minLength: 0)
                accessory
            }
            .foregroundStyle(.white)
            .shadow(color: .black.opacity(0.25), radius: 6, y: 2)
            .padding(20)
            .padding(.top, 40)
        }
        .frame(maxWidth: .infinity, minHeight: minHeight)
        .clipShape(UnevenRoundedRectangle(bottomLeadingRadius: 28, bottomTrailingRadius: 28, style: .continuous))
        .clipped()
    }
}

#Preview {
    GradientHeaderView(park: Park.seed[3]) {
        FavoriteButton(isFavorite: true) {}
    }
}
