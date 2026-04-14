
import React from 'react';
import { Gavel, Mail, Phone, MapPin, ShieldCheck, CreditCard, Truck, HelpCircle } from 'lucide-react';

interface FooterProps {
  onOpenPage: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenPage }) => {
  return (
    <footer className="bg-[#232f3e] text-white pt-12 pb-20">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Gavel className="text-[#febd69]" size={28} />
              <span className="text-2xl font-bold italic">Amaze<span className="text-[#febd69]">Bid</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nền tảng thương mại điện tử và đấu giá trực tuyến hàng đầu, kết nối người mua và người bán thông qua trải nghiệm mua sắm an toàn và thú vị.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#febd69]" />
                <span>123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-[#febd69]" />
                <span>Hotline: 1900 1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[#febd69]" />
                <span>Email: support@amazebid.vn</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Mã số thuế: 0123456789</p>
              </div>
            </div>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <HelpCircle size={20} className="text-[#febd69]" /> Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><button onClick={() => onOpenPage('quy-trinh-giao-dich')} className="hover:text-[#febd69] transition-colors">Quy trình giao dịch</button></li>
              <li><button onClick={() => onOpenPage('khieu-nai')} className="hover:text-[#febd69] transition-colors">Giải quyết khiếu nại</button></li>
              <li><button onClick={() => onOpenPage('doi-tra')} className="hover:text-[#febd69] transition-colors">Chính sách đổi trả</button></li>
              <li><button onClick={() => onOpenPage('lien-he')} className="hover:text-[#febd69] transition-colors">Liên hệ với chúng tôi</button></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#febd69]" /> Chính sách & Quy định
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><button onClick={() => onOpenPage('quy-che-hoat-dong')} className="hover:text-[#febd69] transition-colors">Quy chế hoạt động</button></li>
              <li><button onClick={() => onOpenPage('chinh-sach-bao-mat')} className="hover:text-[#febd69] transition-colors">Chính sách bảo mật</button></li>
              <li><button onClick={() => onOpenPage('an-toan-thanh-toan')} className="hover:text-[#febd69] transition-colors">An toàn thanh toán</button></li>
              <li><button onClick={() => onOpenPage('dieu-khoan-dich-vu')} className="hover:text-[#febd69] transition-colors">Điều khoản dịch vụ</button></li>
            </ul>
          </div>

          {/* Payment & Shipping */}
          <div>
            <h3 className="text-lg font-bold mb-6">Thanh toán & Vận chuyển</h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Phương thức thanh toán</p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/10 p-2 rounded border border-white/5 hover:border-[#febd69] transition-colors">
                    <CreditCard size={24} className="text-gray-300" />
                  </div>
                  <div className="bg-white/10 p-2 rounded border border-white/5 hover:border-[#febd69] transition-colors">
                    <span className="font-bold text-xs">VISA</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded border border-white/5 hover:border-[#febd69] transition-colors">
                    <span className="font-bold text-xs">MOMO</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Đối tác vận chuyển</p>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/10 p-2 rounded border border-white/5 hover:border-[#febd69] transition-colors">
                    <Truck size={24} className="text-gray-300" />
                  </div>
                  <div className="bg-white/10 p-2 rounded border border-white/5 hover:border-[#febd69] transition-colors">
                    <span className="font-bold text-xs">GHTK</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded border border-white/5 hover:border-[#febd69] transition-colors">
                    <span className="font-bold text-xs">J&T</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2024 AmazeBid. Bản quyền thuộc về Công ty TNHH Giải pháp Công nghệ AmazeBid.</p>
          <div className="flex gap-6">
            <button onClick={() => onOpenPage('home')} className="hover:text-white transition-colors">Về chúng tôi</button>
            <button onClick={() => onOpenPage('chinh-sach-bao-mat')} className="hover:text-white transition-colors">Bảo mật</button>
            <button onClick={() => onOpenPage('quy-che-hoat-dong')} className="hover:text-white transition-colors">Điều khoản</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
