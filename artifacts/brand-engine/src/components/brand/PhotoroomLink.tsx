export function PhotoroomLink() {
  return (
    <a
      href="https://www.photoroom.com/tools/background-remover"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-[6px] flex items-center justify-between gap-[8px] py-[8px] px-[10px] rounded-[8px] bg-[rgba(40,150,251,0.06)] border border-[rgba(40,150,251,0.18)] text-[10px] text-[#94A3B8] hover:text-white hover:bg-[rgba(40,150,251,0.12)] hover:border-[rgba(40,150,251,0.4)] transition-all"
    >
      <span>Need a cleaner cutout? Try <span className="font-semibold text-[#2896FB]">Photoroom</span></span>
      <span className="text-[#2896FB]">↗</span>
    </a>
  );
}
