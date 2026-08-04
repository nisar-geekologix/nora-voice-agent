"use client";

import { TRUSTED_BRANDS } from "../data/brandData";

export default function LogoCloud() {
  return (
    <section className="py-12 border-y border-white/5 bg-[#0D0D0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#A1A1AA] mb-8">
          Trusted by teams building the future
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center">
          {TRUSTED_BRANDS.map((brand, idx) => (
            <div 
              key={idx}
              className="text-lg font-extrabold text-[#A1A1AA]/60 hover:text-white transition-colors duration-300 tracking-wider uppercase"
            >
              {brand.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
