import type { Category } from '../../types/catalog';

interface CategoryCardMeta {
  title: string;
  slug: string;
  tagline: string;
  imageUrl: string;
}

interface CategoryShowcaseProps {
  categories: Category[];
  activeCategorySlug?: string;
  onSelectCategory: (slug: string) => void;
}

export default function CategoryShowcase({
  categories,
  activeCategorySlug,
  onSelectCategory,
}: CategoryShowcaseProps) {
  // Editorial imagery curated specifically with a unified high-fashion studio tailoring art direction
  const editorialVisuals: Record<string, { image: string; tagline: string }> = {
    'thoi-trang-nu': {
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
      tagline: 'Đầm Lụa, Váy Maxi & Set Đồ Thanh Lịch',
    },
    'dam-vay': {
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
      tagline: 'Váy Dạ Hội & Lụa Tơ Tằm Dự Tiệc',
    },
    'ao-nu': {
      image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=900&q=80',
      tagline: 'Áo Blazer Linen & Sơ Mi Thiết Kế',
    },
    'thoi-trang-nam': {
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
      tagline: 'Sơ Mi Oxford, Quần Âu & Polo Tối Giản',
    },
  };

  // Flatten top-level and first-level children from actual DB categories
  const featuredCards: CategoryCardMeta[] = [];

  for (const cat of categories) {
    const meta = editorialVisuals[cat.slug] || {
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
      tagline: cat.description || 'Bộ sưu tập may đo thiết kế',
    };
    featuredCards.push({
      title: cat.name,
      slug: cat.slug,
      tagline: meta.tagline,
      imageUrl: meta.image,
    });

    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        if (featuredCards.length < 4) {
          const childMeta = editorialVisuals[child.slug] || {
            image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
            tagline: child.description || 'Thiết kế cao cấp độc bản',
          };
          featuredCards.push({
            title: child.name,
            slug: child.slug,
            tagline: childMeta.tagline,
            imageUrl: childMeta.image,
          });
        }
      }
    }
  }

  // Fallback cards if DB categories are not yet loaded
  const displayCards: CategoryCardMeta[] =
    featuredCards.length > 0
      ? featuredCards.slice(0, 4)
      : [
          {
            title: 'Thời trang Nữ',
            slug: 'thoi-trang-nu',
            tagline: 'Đầm Lụa, Váy Maxi & Set Đồ Thanh Lịch',
            imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
          },
          {
            title: 'Đầm & Váy',
            slug: 'dam-vay',
            tagline: 'Váy Dạ Hội & Lụa Tơ Tằm Dự Tiệc',
            imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
          },
          {
            title: 'Áo Nữ',
            slug: 'ao-nu',
            tagline: 'Áo Blazer Linen & Sơ Mi Thiết Kế',
            imageUrl: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=900&q=80',
          },
          {
            title: 'Thời trang Nam',
            slug: 'thoi-trang-nam',
            tagline: 'Sơ Mi Oxford, Quần Âu & Polo Tối Giản',
            imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
          },
        ];

  const handleCardClick = (slug: string) => {
    onSelectCategory(slug);
    const catalogElem = document.getElementById('catalog-section');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categories" aria-label="Shop by Category" className="relative z-10 bg-[#0A0B0E] py-16 px-4 sm:px-6 lg:px-8 border-b border-[#333235]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#333235] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-[2.5px] text-[#D6B27C] uppercase font-bold">
              <span>CURATED LINEUP</span>
              <span className="text-[#534839]">/</span>
              <span>DANH MỤC THIẾT KẾ</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#F5F0E9] font-normal mt-1">
              Khám Phá Theo Danh Mục
            </h2>
          </div>
          <p className="text-xs text-[#AAA5A0] font-mono max-w-md">
            Tuyển chọn các dòng trang phục chủ đạo từ lụa tơ tằm, linen tự nhiên đến âu phục may đo chuẩn dáng.
          </p>
        </div>

        {/* Grid of Large Editorial Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayCards.map((card) => {
            const isSelected = activeCategorySlug === card.slug;

            return (
              <div
                key={card.slug}
                role="button"
                tabIndex={0}
                aria-label={`Khám phá bộ sưu tập ${card.title}`}
                onClick={() => handleCardClick(card.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(card.slug);
                  }
                }}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border cursor-pointer transition-all duration-500 shadow-md ${
                  isSelected
                    ? 'border-[#D6B27C] ring-2 ring-[#D6B27C]/40'
                    : 'border-[#333235] hover:border-[#D6B27C]/60 hover:-translate-y-1'
                }`}
              >
                {/* Background Photography */}
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Dark Gradient Overlay for Typography Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F11]/95 via-[#0E0F11]/40 to-transparent" />

                {/* Content Box */}
                <div className="absolute inset-x-0 bottom-0 p-5 space-y-2 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-[#D6B27C] font-semibold">
                      COLLECTION
                    </span>
                    <span className="w-6 h-6 rounded-full bg-[#D6B27C]/20 border border-[#D6B27C]/40 text-[#D6B27C] text-xs flex items-center justify-center group-hover:bg-[#D6B27C] group-hover:text-[#111214] transition-colors">
                      ↗
                    </span>
                  </div>

                  <h3 className="font-editorial text-xl sm:text-2xl text-[#F5F0E9] font-normal leading-tight group-hover:text-[#D6B27C] transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-[11px] text-[#AAA5A0] line-clamp-1 font-sans">
                    {card.tagline}
                  </p>

                  {isSelected && (
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-0.5 bg-[#D6B27C] text-[#111214] text-[9px] font-mono font-bold uppercase rounded-md">
                        ĐANG CHỌN
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
