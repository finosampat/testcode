from .base import DocumentRef, SourceAdapter
from .sai_satcharita import SaiSatcharitaSource

REGISTRY: dict[str, type] = {
    SaiSatcharitaSource.slug: SaiSatcharitaSource,
}


def get_source(slug: str) -> SourceAdapter:
    try:
        return REGISTRY[slug]()  # type: ignore[return-value]
    except KeyError:
        raise SystemExit(f"unknown source {slug!r}; available: {', '.join(sorted(REGISTRY))}") from None


__all__ = ["DocumentRef", "SourceAdapter", "REGISTRY", "get_source", "SaiSatcharitaSource"]
