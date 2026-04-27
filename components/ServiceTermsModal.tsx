import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gavel, RefreshCw, CheckCircle2, Lock, Check, AlertTriangle } from 'lucide-react';

interface ServiceTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRead: () => void;
}

const ServiceTermsModal: React.FC<ServiceTermsModalProps> = ({ isOpen, onClose, onConfirmRead }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Gavel size={20} />
              </div>
              <h2 className="font-bold text-gray-900">AmazeBid Service</h2>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">ĐIỀU KHOẢN DỊCH VỤ</h1>
              <p className="text-gray-500 font-medium">(Terms of Service – TOS)</p>
              <div className="w-24 h-1 bg-indigo-600 mx-auto mt-6 rounded-full" />
            </div>

            <div className="space-y-12 pb-12">
              {/* 1. Giới thiệu */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">1</span>
                  Giới thiệu
                </h3>
                <p className="text-gray-600 leading-relaxed pl-14 text-sm">
                  AmazeBid là nền tảng hỗ trợ bán hàng và tạo nội dung bằng AI, cung cấp công cụ để người bán đăng sản phẩm, tạo nội dung marketing, quản lý đơn hàng và tối ưu hiệu suất kinh doanh. Khi sử dụng AmazeBid, người dùng đồng ý tuân thủ toàn bộ Điều khoản Dịch vụ này.
                </p>
              </section>

              {/* 2. Định nghĩa */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">2</span>
                  Định nghĩa
                </h3>
                <div className="pl-14 space-y-4">
                  {[
                    { label: "Nền tảng", value: "AmazeBid và toàn bộ hệ thống liên quan." },
                    { label: "Người bán", value: "Cá nhân hoặc tổ chức đăng sản phẩm và kinh doanh trên AmazeBid." },
                    { label: "Nội dung AI", value: "Hình ảnh, video, mô tả, kịch bản livestream và các tài liệu được tạo bởi hệ thống AI của AmazeBid." },
                    { label: "Phí dịch vụ", value: "Khoản phí AmazeBid thu từ người bán theo mô hình đã công bố." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="font-bold text-gray-900 min-w-[120px] text-sm shrink-0">{item.label}:</span>
                      <span className="text-gray-600 text-sm leading-relaxed">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Phạm vi dịch vụ */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">3</span>
                  Phạm vi dịch vụ
                </h3>
                <p className="text-gray-600 pl-14 text-sm mb-4 leading-relaxed">AmazeBid cung cấp một hệ sinh thái dịch vụ toàn diện nhằm hỗ trợ người bán tối ưu hóa hoạt động kinh doanh trên nền tảng thương mại điện tử, bao gồm:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-14">
                  {[
                    { title: "Công cụ đăng sản phẩm và quản lý bán hàng", desc: "Cho phép người bán dễ dàng tạo, chỉnh sửa, quản lý danh mục sản phẩm, theo dõi tồn kho và xử lý đơn hàng hiệu quả." },
                    { title: "Hệ thống tạo nội dung AI gốc 100%", desc: "Tự động tạo ra hình ảnh, video, mô tả sản phẩm, kịch bản livestream độc đáo, giúp tăng tính hấp dẫn và chuyên nghiệp." },
                    { title: "Công cụ phân tích hiệu suất và đề xuất giá", desc: "Cung cấp báo cáo chi tiết về doanh số, lợi nhuận, hành vi khách hàng, đồng thời đề xuất mức giá tối ưu." },
                    { title: "Hệ thống thanh toán và thu phí minh bạch", desc: "Đảm bảo quy trình thanh toán an toàn, nhanh chóng, với các phương thức thanh toán đa dạng." },
                    { title: "Hỗ trợ kỹ thuật và chăm sóc khách hàng", desc: "Đội ngũ hỗ trợ chuyên nghiệp, sẵn sàng giải đáp thắc mắc, xử lý sự cố kỹ thuật và tư vấn kinh doanh." },
                    { title: "Tích hợp đa kênh bán hàng", desc: "Hỗ trợ kết nối và đồng bộ sản phẩm, đơn hàng với các kênh bán hàng khác như mạng xã hội, sàn thương mại điện tử đối tác." },
                    { title: "Quản lý vận chuyển và logistics", desc: "Cung cấp công cụ theo dõi vận chuyển, quản lý đơn hàng giao nhận, giúp người bán kiểm soát toàn bộ chuỗi cung ứng." },
                    { title: "Bảo mật và tuân thủ pháp luật", desc: "Đảm bảo an toàn dữ liệu người dùng, tuân thủ các quy định pháp luật về thương mại điện tử và bảo vệ quyền lợi người tiêu dùng." }
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all hover:shadow-md hover:bg-white group">
                      <h4 className="font-extrabold text-gray-900 mb-1 flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 group-hover:scale-125 transition-transform" />
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed pl-4">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-indigo-600 italic mt-6 pl-14">AmazeBid cam kết cung cấp dịch vụ với chất lượng cao, liên tục cải tiến và mở rộng tính năng để đáp ứng nhu cầu phát triển kinh doanh của người bán trong từng giai đoạn.</p>
              </section>

              {/* 4. Quyền và nghĩa vụ của các bên */}
              <section className="space-y-8">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">4</span>
                  Quyền và nghĩa vụ của các bên
                </h3>
                <div className="pl-14 space-y-10">
                  {/* Seller */}
                  <div className="space-y-4">
                    <div className="p-1 px-3 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">4.1 & 4.2 Người bán</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="font-bold text-gray-900 mb-3 text-xs flex items-center gap-2">
                           <CheckCircle2 size={14} className="text-indigo-500" /> Quyền lợi
                        </p>
                        <ul className="space-y-2">
                          {["Sử dụng đầy đủ tính năng của nền tảng theo gói dịch vụ.", "Sở hữu toàn bộ quyền khai thác thương mại đối với nội dung AI được tạo cho sản phẩm.", "Yêu cầu hỗ trợ kỹ thuật khi cần."].map((li, i) => (
                            <li key={i} className="text-[11px] text-gray-600 leading-relaxed flex gap-2">
                              <span className="text-indigo-600 font-bold">•</span> {li}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-3 text-xs flex items-center gap-2">
                           <AlertTriangle size={14} className="text-amber-500" /> Nghĩa vụ
                        </p>
                        <ul className="space-y-1.5">
                          {[
                            "Cung cấp thông tin sản phẩm trung thực.",
                            "Chịu trách nhiệm về nguồn gốc, chất lượng sản phẩm.",
                            "Không vi phạm bản quyền, pháp luật.",
                            "Thanh toán phí dịch vụ đúng hạn.",
                            "Tuân thủ thuế và tài chính.",
                            "Bảo mật tài khoản.",
                            "Hợp tác giải quyết khiếu nại.",
                            "Không thực hiện hành vi gian lận."
                          ].map((li, i) => (
                            <li key={i} className="text-[10px] text-gray-500 leading-tight flex gap-2">
                              <span className="text-amber-500 font-black">-</span> {li}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Buyer */}
                  <div className="space-y-4">
                    <div className="p-1 px-3 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">4.3 Người mua</div>
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <p className="font-bold text-gray-900 text-[10px] mb-2 uppercase opacity-50">Quyền lợi</p>
                           <ul className="text-xs text-gray-700 space-y-2 font-medium">
                              {["Được tiếp cận đầy đủ thông tin.", "Dịch vụ mua hàng an toàn.", "Được bảo vệ quyền lợi pháp luật.", "Được khiếu nại, giải quyết tranh chấp."].map((li, i) => (
                                <li key={i} className="flex gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5" />
                                  {li}
                                </li>
                              ))}
                           </ul>
                        </div>
                        <div>
                           <p className="font-bold text-gray-900 text-[10px] mb-2 uppercase opacity-50">Nghĩa vụ</p>
                           <ul className="text-xs text-gray-600 space-y-2">
                              {["Cung cấp thông tin chính xác.", "Thanh toán đầy đủ.", "Tuân thủ quy định & chính sách.", "Hợp tác giải quyết khiếu nại."].map((li, i) => (
                                <li key={i} className="flex gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                                  {li}
                                </li>
                              ))}
                           </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div className="space-y-4">
                    <div className="p-1 px-3 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">4.4 Đơn vị vận chuyển</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                          <p className="text-sm font-black text-gray-900">Quyền lợi</p>
                          <ul className="text-xs text-gray-500 space-y-2">
                            <li>• Được cung cấp thông tin đơn hàng đầy đủ.</li>
                            <li>• Được nhận thanh toán đúng hạn.</li>
                            <li>• Yêu cầu hỗ trợ phối hợp giao nhận.</li>
                          </ul>
                       </div>
                       <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                          <p className="text-sm font-black text-gray-900">Nghĩa vụ</p>
                          <ul className="text-xs text-gray-500 space-y-2">
                            <li>• Giao đúng thời gian, địa điểm.</li>
                            <li>• Bảo quản hàng hóa nguyên vẹn.</li>
                            <li>• Thông báo sự cố kịp thời.</li>
                            <li>• Bảo mật thông tin đơn hàng.</li>
                          </ul>
                       </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. AmazeBid Quyền/Nghĩa vụ */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">5</span>
                  Quyền và nghĩa vụ của AmazeBid
                </h3>
                <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-widest opacity-50">5.1 Quyền hạn</h4>
                    <ul className="space-y-3">
                      {["Thu phí dịch vụ theo mô hình công bố.", "Tạm ngưng hoặc khóa tài khoản vi phạm.", "Cập nhật, thay đổi hoặc nâng cấp tính năng."].map((li, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-3 items-center">
                          <div className="p-1 bg-indigo-600 text-white rounded-md">
                            <Check size={12} />
                          </div>
                          {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-widest opacity-50">5.2 Nghĩa vụ</h4>
                    <ul className="space-y-3">
                      {["Cung cấp dịch vụ ổn định, minh bạch.", "Bảo mật thông tin người dùng.", "Công bố rõ ràng cách tính phí.", "Hỗ trợ kỹ thuật kịp thời."].map((li, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-3 items-center">
                          <div className="p-1 bg-green-600 text-white rounded-md">
                            <Check size={12} />
                          </div>
                          {li}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* 6. Phí dịch vụ */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">6</span>
                  Phí dịch vụ và thanh toán
                </h3>
                <div className="pl-14 space-y-8">
                  <p className="text-gray-600 text-sm leading-relaxed">AmazeBid thu phí dịch vụ theo phần trăm lợi nhuận hoặc theo mô hình được công bố trong từng giai đoạn. Cụ thể:</p>
                  
                  <div className="overflow-hidden border border-gray-100 rounded-3xl shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase text-gray-500 tracking-wider">Mô hình</th>
                          <th className="p-4 text-[10px] font-black uppercase text-gray-500 tracking-wider">Mô tả</th>
                          <th className="p-4 text-[10px] font-black uppercase text-gray-500 tracking-wider">Ví dụ</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        <tr className="border-t border-gray-100">
                          <td className="p-4 font-bold text-gray-900">Phần trăm lợi nhuận</td>
                          <td className="p-4 text-gray-500">Thu tỷ lệ % trên lợi nhuận thu được.</td>
                          <td className="p-4 text-indigo-600 font-medium">LN 1tr × 5% = 50k phí.</td>
                        </tr>
                        <tr className="border-t border-gray-100 bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900">Phí cố định theo giai đoạn</td>
                          <td className="p-4 text-gray-500">Áp dụng mức phí cố định hoặc thấp theo chương trình.</td>
                          <td className="p-4 text-gray-500 italic">Khởi động: Free hoặc thấp.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-900 text-white p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
                     <div className="text-center">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Công thức tính phí dịch vụ</h4>
                        <div className="p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                           <div className="text-2xl md:text-3xl font-mono tracking-widest leading-relaxed">
                              PHÍ = <span className="text-indigo-400">LỢI NHUẬN</span> × <span className="text-indigo-400">% TỶ LỆ</span>
                           </div>
                           <div className="h-px bg-white/10 w-full my-6" />
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Lợi nhuận = Doanh thu - Chi phí</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[9px] font-black uppercase text-indigo-300 opacity-60 mb-2">Ví dụ (Tính theo % LN)</p>
                           <ul className="text-[11px] space-y-1 text-gray-300">
                              <li>• Doanh thu: 10.000.000 VND</li>
                              <li>• Chi phí: 7.000.000 VND</li>
                              <li>• Tỷ lệ: 5% (0.05)</li>
                           </ul>
                        </div>
                        <div className="flex flex-col justify-center items-center p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                           <p className="text-xl font-black text-white">150.000 VND</p>
                           <p className="text-[9px] text-indigo-300 font-bold uppercase mt-1 tracking-widest">Phí dịch vụ cuối cùng</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-4">
                     <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Check size={14} className="text-green-500" /> Cam kết phí
                     </h4>
                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          "Không thu bất kỳ khoản phí ẩn nào.",
                          "Khấu trừ trực tiếp từ doanh thu.",
                          "Thông báo thay đổi phí trước 15 ngày.",
                          "Hòa giải ưu tiên khi có tranh chấp phí."
                        ].map((li, i) => (
                          <li key={i} className="text-[11px] text-gray-500 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                            {li}
                          </li>
                        ))}
                     </ul>
                  </div>
                </div>
              </section>

              {/* 7. AI Ownership */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">7</span>
                  Nội dung AI & Sở hữu trí tuệ
                </h3>
                <div className="pl-14 space-y-4">
                  {[
                    { label: "7.1 Gốc 100%", value: "AmazeBid cam kết nội dung AI là gốc hoàn toàn, không sao chép." },
                    { label: "7.2 Quyền sở hữu", value: "Người bán sở hữu toàn bộ quyền khai thác thương mại đối với nội dung AI tạo ra." },
                    { label: "7.3 Trách nhiệm", value: "Người bán cam kết sử dụng hợp pháp. Chúng tôi không chịu trách nhiệm nếu dùng sai mục đích." }
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <p className="text-xs font-bold text-gray-900 mb-1">{item.label}</p>
                       <p className="text-xs text-gray-600 leading-relaxed">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 8. Forbidden */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">8</span>
                  Hành vi bị cấm
                </h3>
                <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Sản phẩm giả mạo, vi phạm SHTT.",
                    "Dùng tài sản trí tuệ không phép.",
                    "Sao chép nội dung từ Google/nguồn khác.",
                    "Sử dụng Deepfake người khác trái phép.",
                    "Gian lận, lừa đảo, chiếm đoạt.",
                    "Nội dung nhạy cảm, bạo lực, thù địch.",
                    "Phát tán mã độc, virus, ransomware.",
                    "Can thiệp trái phép hệ thống AmazeBid.",
                    "Vi phạm luật pháp (Rửa tiền...)."
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 text-red-900 text-[10px] font-bold">
                       <Lock size={12} className="shrink-0 text-red-500" />
                       {item}
                    </div>
                  ))}
                  <div className="md:col-span-2 p-3 bg-red-600 text-white rounded-xl text-[10px] font-black text-center uppercase tracking-widest mt-2 animate-pulse">
                    ⚠️ Có quyền khóa tài khoản mà không cần báo trước
                  </div>
                </div>
              </section>

              {/* 9. Luật pháp */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">9</span>
                  Thuế & Nghĩa vụ pháp lý
                </h3>
                <div className="pl-14 space-y-6">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { title: "Luật TMĐT 2025", p: "Trách nhiệm sàn." },
                        { title: "Bộ luật Dân sự", p: "Hợp đồng." },
                        { title: "Luật Thuế", p: "Nghĩa vụ số." },
                        { title: "Luật Bảo vệ NTD", p: "Quyền lợi mua." }
                      ].map((li, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center space-y-1">
                           <p className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">{li.title}</p>
                           <p className="text-[8px] text-gray-500 leading-tight">{li.p}</p>
                        </div>
                      ))}
                   </div>
                   <div className="space-y-3 text-xs leading-relaxed text-gray-600">
                      <p><strong className="text-gray-900">9.2 Thuế:</strong> Người bán tự kê khai. AmazeBid không chịu trách nhiệm lỗi thuế.</p>
                      <p><strong className="text-gray-900">9.3 Khấu trừ:</strong> Có quyền trích nộp ngân sách nếu luật định.</p>
                      <p><strong className="text-gray-900">9.4 Thông tin:</strong> Cung cấp dữ liệu cho cơ quan thuế/thanh tra.</p>
                      <p><strong className="text-gray-900">9.5 Hóa đơn:</strong> Người bán có trách nhiệm xuất hóa đơn cho khách.</p>
                      <p><strong className="text-gray-900">9.6 Tuân thủ:</strong> Cam kết làm đúng quy định cạnh tranh lành mạnh.</p>
                   </div>
                </div>
              </section>

              {/* 10. Bảo mật */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">10</span>
                  Bảo mật thông tin
                </h3>
                <div className="pl-14 space-y-6">
                  <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 space-y-6 shadow-indigo-100 shadow-md">
                     <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                           <p className="text-[10px] font-black text-indigo-600 uppercase mb-3">Dữ liệu thu thập</p>
                           <ul className="text-xs text-indigo-900 space-y-2">
                             <li>• Tên, MST, CCCD</li>
                             <li>• SĐT, Email, Địa chỉ</li>
                             <li>• Thông tin giao dịch</li>
                             <li>• IP, Cookies</li>
                           </ul>
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black text-indigo-600 uppercase mb-3">Mục đích dùng</p>
                           <ul className="text-xs text-indigo-900 space-y-2">
                             <li>• Cung cấp/duy trì dịch vụ</li>
                             <li>• Xử lý đơn & thanh toán</li>
                             <li>• Hỗ trợ & giải quyết</li>
                             <li>• Cải thiện trải nghiệm</li>
                           </ul>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 p-4 bg-white rounded-2xl">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg"><Check size={16} /></div>
                        <p className="text-[11px] text-gray-600 italic">"Chúng tôi cam kết KHÔNG bán hoặc chia sẻ dữ liệu cho bên thứ ba vì mục đích thương mại."</p>
                     </div>
                  </div>
                </div>
              </section>

              {/* 11. Trách nhiệm */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">11</span>
                  Giới hạn trách nhiệm
                </h3>
                <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     "Miễn trừ thiệt hại trực tiếp/hệ quả từ sử dụng dịch vụ.",
                     "Tranh chấp chất lượng/thanh toán do các bên tự lo.",
                     "Miễn trách nhiệm cho sự cố bất khả kháng (Thiên tai...).",
                     "Không chịu trách nhiệm về link bên thứ ba trên sàn."
                   ].map((li, i) => (
                     <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-[10px] text-gray-500 leading-relaxed font-medium">
                        {li}
                     </div>
                   ))}
                </div>
              </section>

              {/* 12. Chấm dứt */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">12</span>
                  Tạm ngưng & Chấm dứt
                </h3>
                <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-widest">AmazeBid Quyền</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Có quyền khóa/xóa tài khoản nếu vi phạm TOS hoặc gian lận mà không cần báo.</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Người dùng Quyền</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Yêu cầu đóng account sau khi hoàn tất thanh toán & đơn hàng đang treo.</p>
                   </div>
                </div>
              </section>

              {/* 13 & 14 */}
              <section className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">13</span>
                    Thay đổi & Cập nhật
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed pl-14">
                    Chúng tôi có quyền sửa đổi TOS bất kì lúc nào. Thay đổi có hiệu lực ngay khi đăng. Bạn chịu trách nhiệm kiểm tra thường xuyên.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">14</span>
                    Luật áp dụng & Giải quyết
                  </h3>
                  <div className="text-xs text-gray-600 leading-relaxed pl-14 flex items-center gap-4">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex-1 text-center">
                       <p className="font-bold text-gray-900 uppercase text-[9px] mb-1">Luật điều chỉnh</p>
                       <p className="text-indigo-600 font-bold">Pháp luật Việt Nam</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex-1 text-center">
                       <p className="font-bold text-gray-900 uppercase text-[9px] mb-1">Cơ quan xử lý</p>
                       <p className="text-indigo-600 font-bold">Tòa án có thẩm quyền VN</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 15. Xác nhận */}
              <section className="space-y-6 mt-8">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm shrink-0 shadow-lg shadow-gray-200">15</span>
                  Xác nhận & Chấp thuận
                </h3>
                <div className="pl-14">
                   <div className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                      <div className="relative text-center space-y-6">
                         <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-3xl shadow- inner">
                            <CheckCircle2 size={40} className="text-white" />
                         </div>
                         <p className="text-base leading-relaxed text-indigo-50 font-medium max-w-lg mx-auto">
                           Bằng việc đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào của AmazeBid, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi toàn bộ các điều khoản và điều kiện này.
                         </p>
                         <div className="pt-8 border-t border-white/20">
                            <p className="text-2xl font-black uppercase tracking-[0.4em]">ĐÃ XÁC NHẬN</p>
                            <p className="text-[10px] text-indigo-300 font-bold mt-2 uppercase tracking-widest opacity-60">Phiên bản 2.0 • Last Update: {new Date().toLocaleDateString('vi-VN')}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
            <button 
              onClick={() => {
                onConfirmRead();
                onClose();
              }}
              className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl hover:shadow-gray-200 flex items-center gap-3 uppercase tracking-widest group"
            >
              Tôi đã hiểu & Đóng <Check size={18} className="group-hover:scale-125 transition-transform text-green-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ServiceTermsModal;
