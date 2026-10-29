export default function BrandValueStrip() {
  const values = [
    {
      icon: '✦',
      title: 'CHẤT LIỆU TỰ NHIÊN',
      subtitle: 'Lụa Tơ Tằm, Linen Mộc & Cotton Sợi Dài được tuyển chọn nghiêm ngặt theo tiêu chuẩn cao cấp.',
    },
    {
      icon: '◈',
      title: 'FORM DÁNG CHUẨN MỰC',
      subtitle: 'Kỹ nghệ cắt may đo đạc tỉ mỉ theo tỷ lệ hình thể Á Đông, tôn vinh phong thái tự tin và thanh lịch.',
    },
    {
      icon: '◎',
      title: 'HƯỚNG DẪN BẢO QUẢN',
      subtitle: 'Quy trình giặt ủi và chăm sóc chuyên biệt cho từng loại sợi vải được cung cấp chi tiết trên mỗi sản phẩm.',
    },
    {
      icon: '❖',
      title: 'ĐỘC BẢN BIẾN THỂ',
      subtitle: 'Minh bạch kích cỡ (XS–XXL), mã màu swatch trực quan và quản lý tồn kho nguyên tử theo từng SKU.',
    },
  ];

  return (
    <section aria-label="Brand Philosophy" className="relative z-10 border-b border-[#333235] bg-[#0A0B0E] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex items-start gap-3.5 p-4 rounded-xl bg-[#191A1D]/60 border border-[#333235]/60 hover:border-[#D6B27C]/40 transition-colors"
          >
            <span className="text-base text-[#D6B27C] font-mono shrink-0 mt-0.5">{v.icon}</span>
            <div className="space-y-1">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F5F0E9]">
                {v.title}
              </h3>
              <p className="text-[11px] text-[#AAA5A0] leading-relaxed">
                {v.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

