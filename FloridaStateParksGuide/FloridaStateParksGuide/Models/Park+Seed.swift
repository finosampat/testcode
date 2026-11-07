import Foundation

extension Park {
    /// Real Florida state parks. Acreage and establishment years are approximate,
    /// based on publicly available Florida State Parks information.
    static let seed: [Park] = [
        Park(
            id: "john-pennekamp",
            name: "John Pennekamp Coral Reef State Park",
            region: .keys,
            description: "The first undersea park in the United States, protecting a stretch of the only living coral barrier reef in the continental U.S. Glass-bottom boat tours, snorkeling and diving trips visit the reef and the famous Christ of the Abyss statue.",
            establishedYear: 1963,
            acreage: 63_840,
            activities: [.snorkeling, .scubaDiving, .paddling, .boating, .fishing, .camping, .swimming],
            gradientHex: [0x00C6FF, 0x0072FF, 0x00E5A0],
            headerSymbol: "fish.fill"
        ),
        Park(
            id: "bahia-honda",
            name: "Bahia Honda State Park",
            region: .keys,
            description: "Known for some of the finest white-sand beaches in the Keys, Bahia Honda offers clear shallow water, a historic span of Henry Flagler's Overseas Railroad, and excellent snorkeling at Looe Key.",
            establishedYear: 1961,
            acreage: 524,
            activities: [.swimming, .snorkeling, .beachcombing, .paddling, .camping, .fishing, .history],
            gradientHex: [0x43E97B, 0x38F9D7, 0x1FA2FF],
            headerSymbol: "beach.umbrella.fill"
        ),
        Park(
            id: "bill-baggs",
            name: "Bill Baggs Cape Florida State Park",
            region: .southeast,
            description: "At the southern tip of Key Biscayne, this park is home to the Cape Florida Lighthouse, built in 1825 and the oldest standing structure in Miami-Dade County, with beaches overlooking the Miami skyline.",
            establishedYear: 1967,
            acreage: 410,
            activities: [.swimming, .beachcombing, .biking, .fishing, .history, .picnicking],
            gradientHex: [0xFF9A8B, 0xFF6A88, 0xFF99AC],
            headerSymbol: "light.beacon.max.fill"
        ),
        Park(
            id: "jonathan-dickinson",
            name: "Jonathan Dickinson State Park",
            region: .southeast,
            description: "A diverse landscape of sand pine scrub, pine flatwoods and mangroves along the Loxahatchee River, Florida's first federally designated Wild and Scenic River. Visitors can tour the restored Trapper Nelson homestead.",
            establishedYear: 1950,
            acreage: 11_500,
            activities: [.hiking, .biking, .paddling, .boating, .camping, .horsebackRiding, .history],
            gradientHex: [0x11998E, 0x38EF7D],
            headerSymbol: "tree.fill"
        ),
        Park(
            id: "fakahatchee-strand",
            name: "Fakahatchee Strand Preserve State Park",
            region: .southwest,
            description: "The orchid and bromeliad capital of the continental U.S. This linear swamp forest shelters rare ghost orchids, royal palms under bald cypress, Florida panthers and black bears.",
            establishedYear: 1974,
            acreage: 75_000,
            activities: [.hiking, .paddling, .birding, .wildlifeViewing, .photography],
            gradientHex: [0x134E5E, 0x71B280],
            headerSymbol: "leaf.fill"
        ),
        Park(
            id: "myakka-river",
            name: "Myakka River State Park",
            region: .southwest,
            description: "One of Florida's oldest and largest state parks, protecting wetlands, prairies and hammocks along the Myakka River. The canopy walkway and airboat tours reveal alligators, wading birds and wide-open wildlands.",
            establishedYear: 1941,
            acreage: 37_000,
            activities: [.hiking, .biking, .paddling, .boating, .camping, .birding, .wildlifeViewing, .horsebackRiding],
            gradientHex: [0xF7971E, 0xFFD200, 0x8BC34A],
            headerSymbol: "bird.fill"
        ),
        Park(
            id: "hillsborough-river",
            name: "Hillsborough River State Park",
            region: .westCentral,
            description: "One of Florida's original state parks, developed by the Civilian Conservation Corps. The river tumbles over limestone outcrops to form rare Class II rapids, and nearby Fort Foster is a reconstructed Second Seminole War fort.",
            establishedYear: 1938,
            acreage: 3_383,
            activities: [.hiking, .biking, .paddling, .camping, .fishing, .history, .picnicking],
            gradientHex: [0x5A3F37, 0x2C7744],
            headerSymbol: "water.waves"
        ),
        Park(
            id: "honeymoon-island",
            name: "Honeymoon Island State Park",
            region: .westCentral,
            description: "A barrier island near Dunedin with miles of Gulf beaches, one of the few remaining virgin slash pine forests in South Florida, and nesting osprey and bald eagles along the Osprey Trail.",
            establishedYear: 1982,
            acreage: 385,
            activities: [.swimming, .beachcombing, .hiking, .birding, .fishing, .paddling, .picnicking],
            gradientHex: [0xFC5C7D, 0x6A82FB],
            headerSymbol: "sun.max.fill"
        ),
        Park(
            id: "weeki-wachee",
            name: "Weeki Wachee Springs State Park",
            region: .westCentral,
            description: "Famous since 1947 for its live mermaid shows performed in an underwater theater, Weeki Wachee also offers a spring-fed swimming area and kayaking down the crystal-clear Weeki Wachee River.",
            establishedYear: 2008,
            acreage: 538,
            activities: [.swimming, .paddling, .boating, .wildlifeViewing, .history],
            gradientHex: [0x00D2FF, 0x3A7BD5, 0x8E54E9],
            headerSymbol: "drop.fill"
        ),
        Park(
            id: "highlands-hammock",
            name: "Highlands Hammock State Park",
            region: .central,
            description: "One of Florida's first state parks, with an ancient hammock of massive live oaks, an old-growth cypress swamp boardwalk, and a museum honoring the Civilian Conservation Corps who built it.",
            establishedYear: 1931,
            acreage: 9_000,
            activities: [.hiking, .biking, .camping, .birding, .wildlifeViewing, .horsebackRiding, .history],
            gradientHex: [0x3CA55C, 0xB5AC49],
            headerSymbol: "tree.fill"
        ),
        Park(
            id: "blue-spring",
            name: "Blue Spring State Park",
            region: .central,
            description: "A designated manatee refuge and the winter home of hundreds of West Indian manatees. The first-magnitude spring stays a constant 72°F, making it a warm-season favorite for swimming and tubing.",
            establishedYear: 1972,
            acreage: 2_643,
            activities: [.swimming, .snorkeling, .scubaDiving, .tubing, .paddling, .wildlifeViewing, .camping, .history],
            gradientHex: [0x2193B0, 0x6DD5ED],
            headerSymbol: "drop.fill"
        ),
        Park(
            id: "silver-springs",
            name: "Silver Springs State Park",
            region: .northCentral,
            description: "Home to one of the largest artesian spring formations in the world. Glass-bottom boats have cruised the head spring since the 1870s, and paddlers often spot rhesus monkeys, manatees and alligators along the Silver River.",
            establishedYear: 2013,
            acreage: 4_000,
            activities: [.paddling, .boating, .hiking, .biking, .camping, .wildlifeViewing, .history],
            gradientHex: [0xA8C0FF, 0x3F2B96],
            headerSymbol: "sparkles"
        ),
        Park(
            id: "ichetucknee-springs",
            name: "Ichetucknee Springs State Park",
            region: .northCentral,
            description: "Nine major springs feed the gin-clear Ichetucknee River, a National Natural Landmark. Summer tubing down the six-mile river is a beloved Florida tradition.",
            establishedYear: 1970,
            acreage: 2_669,
            activities: [.tubing, .swimming, .snorkeling, .paddling, .hiking, .wildlifeViewing, .picnicking],
            gradientHex: [0x56CCF2, 0x2F80ED, 0x27AE60],
            headerSymbol: "lifepreserver.fill"
        ),
        Park(
            id: "paynes-prairie",
            name: "Paynes Prairie Preserve State Park",
            region: .northCentral,
            description: "Florida's first state preserve, a vast savanna where wild bison, wild horses and more than 270 species of birds roam. The 50-foot observation tower offers sweeping views of the prairie.",
            establishedYear: 1971,
            acreage: 21_000,
            activities: [.hiking, .biking, .horsebackRiding, .birding, .wildlifeViewing, .camping, .photography],
            gradientHex: [0xF2994A, 0xF2C94C, 0x6FCF97],
            headerSymbol: "binoculars.fill"
        ),
        Park(
            id: "rainbow-springs",
            name: "Rainbow Springs State Park",
            region: .northCentral,
            description: "Florida's fourth-largest spring has been a gathering place for thousands of years. Landscaped gardens, man-made waterfalls from its tourist-attraction days, and the clear Rainbow River draw swimmers and paddlers.",
            establishedYear: 1995,
            acreage: 1_472,
            activities: [.swimming, .snorkeling, .tubing, .paddling, .hiking, .camping, .picnicking],
            gradientHex: [0xFF5F6D, 0xFFC371, 0x47CF73, 0x4FACFE],
            headerSymbol: "rainbow"
        ),
        Park(
            id: "fort-clinch",
            name: "Fort Clinch State Park",
            region: .northeast,
            description: "One of Florida's original state parks, centered on a well-preserved 19th-century brick fort at the mouth of the St. Marys River. Living-history programs recreate garrison life during the Civil War.",
            establishedYear: 1935,
            acreage: 1_400,
            activities: [.history, .beachcombing, .swimming, .fishing, .camping, .biking, .hiking],
            gradientHex: [0x8E2DE2, 0x4A00E0],
            headerSymbol: "flag.fill"
        ),
        Park(
            id: "anastasia",
            name: "Anastasia State Park",
            region: .northeast,
            description: "Four miles of pristine beach, tidal marshes and ancient sand dunes on Anastasia Island near historic St. Augustine, plus the old coquina quarry that supplied stone for the Castillo de San Marcos.",
            establishedYear: 1949,
            acreage: 1_600,
            activities: [.swimming, .beachcombing, .paddling, .camping, .birding, .fishing, .history],
            gradientHex: [0xFFB75E, 0xED8F03],
            headerSymbol: "sun.horizon.fill"
        ),
        Park(
            id: "wakulla-springs",
            name: "Edward Ball Wakulla Springs State Park",
            region: .panhandle,
            description: "Home to one of the largest and deepest freshwater springs in the world. Riverboat tours glide past alligators, manatees and limpkins, and the 1937 Spanish-style Wakulla Springs Lodge still welcomes guests.",
            establishedYear: 1986,
            acreage: 6_000,
            activities: [.swimming, .boating, .hiking, .birding, .wildlifeViewing, .history],
            gradientHex: [0x0F2027, 0x203A43, 0x2C5364],
            headerSymbol: "water.waves"
        ),
        Park(
            id: "florida-caverns",
            name: "Florida Caverns State Park",
            region: .panhandle,
            description: "The only Florida state park offering guided cave tours, revealing limestone stalactites, stalagmites, soda straws and flowstones. Above ground, the Chipola River and floodplain trails await.",
            establishedYear: 1942,
            acreage: 1_300,
            activities: [.caveTours, .hiking, .biking, .paddling, .camping, .horsebackRiding, .history],
            gradientHex: [0x614385, 0x516395],
            headerSymbol: "mountain.2.fill"
        ),
        Park(
            id: "grayton-beach",
            name: "Grayton Beach State Park",
            region: .panhandle,
            description: "Sugar-white sand and emerald waters along Florida's Gulf Coast, with rare coastal dune lakes, towering dunes, and nature trails through coastal forests.",
            establishedYear: 1968,
            acreage: 2_000,
            activities: [.swimming, .beachcombing, .paddling, .fishing, .hiking, .biking, .camping, .stargazing],
            gradientHex: [0x00B09B, 0x96C93D],
            headerSymbol: "beach.umbrella.fill"
        ),
        Park(
            id: "torreya",
            name: "Torreya State Park",
            region: .panhandle,
            description: "Named for the rare Torreya tree, this park sits on high bluffs over the Apalachicola River with some of Florida's most rugged hiking and the antebellum Gregory House.",
            establishedYear: 1935,
            acreage: 13_000,
            activities: [.hiking, .camping, .birding, .history, .photography, .stargazing],
            gradientHex: [0xD38312, 0xA83279],
            headerSymbol: "leaf.fill"
        ),
    ]
}
