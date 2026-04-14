
import React from 'react';
import { Shield, RefreshCw, Phone, Mail, MapPin, Gavel, Info, Search, CreditCard, Package, Truck, CheckCircle, AlertCircle, FileText, Lock } from 'lucide-react';

interface BusinessPagesProps {
  page: string;
  onClose: () => void;
}

const BusinessPages: React.FC<BusinessPagesProps> = ({ page, onClose }) => {
  const renderContent = () => {
    switch (page) {
      case 'home':
        return (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Info className="text-blue-600" /> Về AmazeBid
              </h2>
              <p className="text-gray-700 leading-relaxed">
                AmazeBid là nền tảng thương mại điện tử thế hệ mới, kết hợp giữa mua sắm truyền thống và đấu giá trực tuyến. Chúng tôi mang đến một không gian mua sắm minh bạch, an toàn và đầy kịch tính cho cả người mua và người bán.
              </p>
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-bold text-lg mb-2 text-blue-800">Tầm nhìn</h3>
                <p className="text-sm text-blue-700">Trở thành sàn đấu giá trực tuyến lớn nhất khu vực, nơi mọi sản phẩm đều tìm thấy giá trị thực sự của nó.</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="font-bold text-lg mb-2 text-orange-800">Sứ mệnh</h3>
                <p className="text-sm text-orange-700">Xây dựng niềm tin trong giao dịch trực tuyến thông qua công nghệ bảo mật và quy trình kiểm soát chặt chẽ.</p>
              </div>
            </section>

            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 text-indigo-900 flex items-center gap-2">
                🌟 Câu chuyện đằng sau cái tên AMAZEBID
              </h2>
              
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p>
                  Trong hành trình xây dựng một nền tảng thương mại hiện đại, chúng tôi muốn tìm một cái tên không chỉ dễ nhớ, dễ đọc, mà còn phải truyền tải được tinh thần cốt lõi của sản phẩm: <strong>đơn giản – mạnh mẽ – gây ấn tượng</strong>. Từ đó, <strong>AMAZEBID</strong> ra đời.
                </p>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-50">
                  <p className="mb-4">Tên gọi này được ghép từ hai từ tiếng Anh:</p>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li><strong>Amaze</strong> – tạo ra sự ngạc nhiên, khiến người dùng phải “wow” vì trải nghiệm vượt mong đợi</li>
                    <li><strong>Bid</strong> – đấu giá, ra giá, mua bán</li>
                  </ul>
                  <div className="border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50/50 italic text-indigo-900 font-medium">
                    Khi kết hợp lại, AMAZEBID mang ý nghĩa: "Một nền tảng mua bán – đấu giá mang đến trải nghiệm bất ngờ, thú vị và đầy cảm hứng cho mọi người."
                  </div>
                </div>

                <p>
                  Chúng tôi tin rằng thương mại không chỉ là giao dịch. Nó là cảm xúc, là sự tin tưởng, là khoảnh khắc người mua tìm được món hàng phù hợp và người bán cảm nhận được giá trị thật sự của sản phẩm. Vì vậy, cái tên AMAZEBID được chọn để đại diện cho mục tiêu lớn hơn: <strong>tạo ra một hành trình mua bán khiến người dùng thích thú ngay từ lần đầu sử dụng.</strong>
                </p>

                <div className="mt-8 pt-8 border-t border-indigo-100">
                  <h3 className="text-xl font-bold mb-4 text-indigo-800 flex items-center gap-2">
                    🔤 Ý nghĩa từng chữ cái
                  </h3>
                  <p className="mb-4">Để củng cố thêm tinh thần thương hiệu, mỗi chữ cái trong AMAZEBID có thể được diễn giải thành những giá trị mà nền tảng theo đuổi:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <ul className="space-y-2 text-sm">
                        <li><strong className="text-indigo-600 text-lg">A</strong> – Amazing / Agile / Authentic</li>
                        <li><strong className="text-indigo-600 text-lg">M</strong> – Marketplace / Modern / Multi-channel</li>
                        <li><strong className="text-indigo-600 text-lg">A</strong> – Auction / Access / Automation</li>
                        <li><strong className="text-indigo-600 text-lg">Z</strong> – Zero-friction / Zenith / Zooming growth</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                      <ul className="space-y-2 text-sm">
                        <li><strong className="text-indigo-600 text-lg">E</strong> – Experience / Engine / Empower</li>
                        <li><strong className="text-indigo-600 text-lg">B</strong> – Bid / Business / Boost</li>
                        <li><strong className="text-indigo-600 text-lg">I</strong> – Intelligence / Innovation / Instant</li>
                        <li><strong className="text-indigo-600 text-lg">D</strong> – Deal / Dynamics / Delivery</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-md">
                    <p className="text-indigo-200 mb-3 text-sm uppercase tracking-wider font-semibold">Thông điệp thương hiệu mở rộng:</p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex gap-2"><span className="text-orange-400">✦</span> <span><strong>A</strong>mazing <strong>M</strong>arketplace for <strong>A</strong>uctions with <strong>Z</strong>ero-friction <strong>E</strong>commerce, <strong>B</strong>oosting <strong>I</strong>ntelligent <strong>D</strong>eals</span></li>
                      <li className="flex gap-2"><span className="text-orange-400">✦</span> <span><strong>A</strong>gile <strong>M</strong>arket <strong>A</strong>uction <strong>Z</strong>enith <strong>E</strong>ngine for <strong>B</strong>usiness <strong>I</strong>nnovation & <strong>D</strong>elivery</span></li>
                      <li className="flex gap-2"><span className="text-orange-400">✦</span> <span><strong>A</strong>uthentic <strong>M</strong>ulti-channel <strong>A</strong>uction <strong>Z</strong>one <strong>E</strong>mpowering <strong>B</strong>uyers with <strong>I</strong>ncredible <strong>D</strong>eals</span></li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-indigo-100">
                  <h3 className="text-xl font-bold mb-4 text-indigo-800 flex items-center gap-2">
                    🚀 Tại sao chúng tôi chọn cái tên này?
                  </h3>
                  <p className="mb-4"><strong>AMAZEBID</strong> được chọn vì nó thể hiện trọn vẹn tầm nhìn của chúng tôi:</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 bg-green-100 p-1 rounded-full text-green-600"><CheckCircle size={16} /></div>
                      <span>Một nền tảng thương mại <strong>quốc tế</strong>, dễ đọc, dễ nhớ</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 bg-green-100 p-1 rounded-full text-green-600"><CheckCircle size={16} /></div>
                      <span>Trải nghiệm <strong>đơn giản, mượt mà, không rào cản</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 bg-green-100 p-1 rounded-full text-green-600"><CheckCircle size={16} /></div>
                      <span>Hệ thống <strong>tự động hóa mạnh mẽ</strong>, hỗ trợ người bán tối đa</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 bg-green-100 p-1 rounded-full text-green-600"><CheckCircle size={16} /></div>
                      <span>Tích hợp <strong>AI thông minh</strong>, giúp tạo nội dung, phân tích sản phẩm, tối ưu giá và nâng cao hiệu quả bán hàng</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 bg-green-100 p-1 rounded-full text-green-600"><CheckCircle size={16} /></div>
                      <span>Một môi trường nơi mọi người đều có thể bán hàng, đấu giá hoặc mua sắm một cách <strong>tự tin và hứng thú</strong></span>
                    </li>
                  </ul>
                  
                  <div className="text-center mt-8 p-6 bg-white rounded-xl border-2 border-dashed border-indigo-200">
                    <p className="text-gray-600 mb-2">Chúng tôi muốn mỗi giao dịch trên AMAZEBID đều mang lại cảm giác “wow” – từ cách đăng sản phẩm, cách hệ thống hỗ trợ, cho đến khoảnh khắc người dùng tìm được mức giá tốt nhất.</p>
                    <p className="text-xl font-bold text-indigo-900 mt-4">AMAZEBID không chỉ là một cái tên. Nó là lời hứa về trải nghiệm.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Thông tin doanh nghiệp</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 bg-gray-50 font-bold text-gray-600 w-1/3">Tên doanh nghiệp</td>
                      <td className="px-6 py-4 text-gray-800">Công ty TNHH Giải pháp Công nghệ AmazeBid</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 bg-gray-50 font-bold text-gray-600">Mã số thuế</td>
                      <td className="px-6 py-4 text-gray-800">0123456789</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 bg-gray-50 font-bold text-gray-600">Địa chỉ trụ sở</td>
                      <td className="px-6 py-4 text-gray-800">123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 bg-gray-50 font-bold text-gray-600">Đại diện pháp luật</td>
                      <td className="px-6 py-4 text-gray-800">Nguyễn Văn A</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 bg-gray-50 font-bold text-gray-600">Ngày cấp phép</td>
                      <td className="px-6 py-4 text-gray-800">01/01/2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      case 'quy-che-hoat-dong':
        return (
          <div className="space-y-8 text-gray-700">
            <div className="text-center border-b pb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Quy chế hoạt động</h2>
              <p className="text-gray-500 font-medium">Sàn giao dịch Thương mại điện tử AmazeBid</p>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-orange-600" /> 1. Nguyên tắc chung
              </h3>
              <p className="text-sm leading-relaxed">Sàn giao dịch TMĐT AmazeBid (sau đây gọi là "AmazeBid") là nền tảng kết nối người bán và người mua, hỗ trợ công nghệ AI để tối ưu hóa trải nghiệm thương mại. Mọi hoạt động trên sàn phải tuân thủ pháp luật Việt Nam, đảm bảo tính minh bạch, công bằng và bảo vệ quyền lợi người tiêu dùng.</p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-orange-600" /> 2. Quy định về thành viên
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <h4 className="font-bold text-orange-900 mb-2">Điều kiện tham gia</h4>
                  <ul className="text-xs space-y-1 text-orange-800">
                    <li>• Cá nhân từ 18 tuổi trở lên, có năng lực hành vi dân sự.</li>
                    <li>• Tổ chức, doanh nghiệp có giấy phép kinh doanh hợp lệ.</li>
                    <li>• Đăng ký tài khoản và xác thực thông tin (KYC).</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 mb-2">Trách nhiệm thành viên</h4>
                  <ul className="text-xs space-y-1 text-gray-600">
                    <li>• Cung cấp thông tin chính xác, trung thực.</li>
                    <li>• Bảo mật mật khẩu và thông tin tài khoản.</li>
                    <li>• Tuân thủ các quy định về đăng tin và giao dịch.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-orange-600" /> 3. Quy trình giao dịch
              </h3>
              <div className="space-y-3">
                {[
                  { step: "Đăng tin", desc: "Người bán sử dụng công cụ AI để tạo nội dung và đăng tải sản phẩm lên sàn." },
                  { step: "Đặt hàng", desc: "Người mua lựa chọn sản phẩm, tham gia đấu giá hoặc mua ngay và thực hiện thanh toán." },
                  { step: "Xác nhận", desc: "Hệ thống xác nhận đơn hàng và thông báo cho người bán chuẩn bị hàng." },
                  { step: "Vận chuyển", desc: "Đơn vị vận chuyển lấy hàng từ người bán và giao đến địa chỉ người mua." },
                  { step: "Hoàn tất", desc: "Người mua nhận hàng, kiểm tra và xác nhận. Tiền được chuyển cho người bán sau khi trừ phí dịch vụ." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                      <p className="font-bold text-sm">{item.step}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-orange-600" /> 4. Quản lý thông tin xấu
              </h3>
              <p className="text-sm">AmazeBid nghiêm cấm đăng tải các sản phẩm, nội dung vi phạm pháp luật, thuần phong mỹ tục hoặc xâm phạm quyền sở hữu trí tuệ của bên thứ ba. Hệ thống AI sẽ tự động quét và gỡ bỏ các nội dung vi phạm.</p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-orange-600" /> 5. Giải quyết tranh chấp
              </h3>
              <p className="text-sm leading-relaxed">Mọi tranh chấp phát sinh sẽ được giải quyết trên tinh thần thương lượng. Nếu không tự thỏa thuận được, AmazeBid sẽ đóng vai trò trung gian hòa giải dựa trên các bằng chứng giao dịch. Trường hợp nghiêm trọng sẽ được đưa ra cơ quan pháp luật có thẩm quyền.</p>
            </section>
          </div>
        );
      case 'chinh-sach-bao-mat':
        return (
          <div className="space-y-8 text-gray-700">
            <div className="text-center border-b pb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Chính sách bảo mật</h2>
              <p className="text-gray-500 font-medium">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-blue-600" /> 1. Thu thập thông tin cá nhân
              </h3>
              <p>AmazeBid thu thập thông tin từ bạn khi bạn đăng ký tài khoản, đăng sản phẩm, thực hiện giao dịch hoặc tương tác với các tính năng AI. Các thông tin bao gồm:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Thông tin tài khoản:</strong> Họ tên, địa chỉ email, số điện thoại, mật khẩu mã hóa.</li>
                <li><strong>Thông tin doanh nghiệp:</strong> Tên cửa hàng, mã số thuế, địa chỉ kinh doanh, thông tin người đại diện.</li>
                <li><strong>Thông tin giao dịch:</strong> Lịch sử mua hàng, chi tiết thanh toán (được xử lý an toàn qua đối tác thanh toán), thông tin vận chuyển.</li>
                <li><strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành, dữ liệu cookies để tối ưu hóa trải nghiệm người dùng.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-blue-600" /> 2. Mục đích sử dụng thông tin
              </h3>
              <p>Chúng tôi sử dụng thông tin thu thập được cho các mục đích sau:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Cung cấp dịch vụ", desc: "Xử lý đăng ký, quản lý tài khoản và thực hiện các giao dịch thương mại." },
                  { title: "Cá nhân hóa trải nghiệm", desc: "Sử dụng AI để đề xuất sản phẩm và nội dung marketing phù hợp với nhu cầu của bạn." },
                  { title: "Hỗ trợ khách hàng", desc: "Giải đáp thắc mắc, xử lý sự cố kỹ thuật và khiếu nại đơn hàng." },
                  { title: "An ninh và bảo mật", desc: "Ngăn chặn các hoạt động gian lận, tấn công mạng và đảm bảo an toàn hệ thống." },
                  { title: "Truyền thông marketing", desc: "Gửi thông báo về cập nhật tính năng, chương trình khuyến mãi (bạn có thể từ chối bất kỳ lúc nào)." }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-sm text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-blue-600" /> 3. Chia sẻ thông tin với bên thứ ba
              </h3>
              <p>AmazeBid cam kết không bán hoặc cho thuê thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Đối tác vận chuyển:</strong> Chia sẻ tên, địa chỉ và SĐT để thực hiện giao hàng.</li>
                <li><strong>Cổng thanh toán:</strong> Chia sẻ thông tin giao dịch để xử lý thanh toán an toàn.</li>
                <li><strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền theo quy định của pháp luật.</li>
                <li><strong>Bảo vệ quyền lợi:</strong> Khi cần thiết để bảo vệ quyền, tài sản hoặc sự an toàn của AmazeBid và người dùng khác.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-blue-600" /> 4. Bảo mật dữ liệu
              </h3>
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
                <p className="text-sm text-blue-900 leading-relaxed">Chúng tôi áp dụng các tiêu chuẩn bảo mật nghiêm ngặt để bảo vệ dữ liệu của bạn, bao gồm mã hóa SSL/TLS cho toàn bộ dữ liệu truyền tải, hệ thống tường lửa đa lớp và kiểm soát truy cập nội bộ chặt chẽ. Tuy nhiên, không có phương thức truyền tải qua internet nào là an toàn 100%, vì vậy chúng tôi khuyến khích bạn tự bảo vệ mật khẩu của mình.</p>
                <div className="flex items-center gap-3 text-blue-700 font-bold text-xs uppercase tracking-widest">
                  <Shield size={16} />
                  <span>Chứng chỉ bảo mật SSL & AES-256 Encryption</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-blue-600" /> 5. Quyền của người dùng
              </h3>
              <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <li className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Quyền truy cập và xem dữ liệu</span>
                </li>
                <li className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Quyền yêu cầu chỉnh sửa thông tin sai lệch</span>
                </li>
                <li className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Quyền yêu cầu xóa tài khoản và dữ liệu</span>
                </li>
                <li className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Quyền từ chối nhận thông tin marketing</span>
                </li>
              </ul>
            </section>
          </div>
        );
      case 'quy-trinh-giao-dich':
        return (
          <div className="space-y-8 text-gray-700">
            <div className="text-center border-b pb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Quy trình giao dịch</h2>
              <p className="text-gray-500 font-medium">Hướng dẫn chi tiết các bước mua bán trên AmazeBid</p>
            </div>

            <div className="space-y-12 relative before:absolute before:left-[19px] before:top-8 before:bottom-8 before:w-0.5 before:bg-gray-100">
              {[
                {
                  title: "Tìm kiếm & Lựa chọn",
                  desc: "Người mua sử dụng thanh tìm kiếm thông minh hoặc danh mục sản phẩm để tìm mặt hàng ưng ý. Công cụ AI sẽ gợi ý các sản phẩm phù hợp với sở thích của bạn.",
                  icon: <Search className="text-white" size={20} />,
                  color: "bg-blue-500"
                },
                {
                  title: "Đặt hàng & Thanh toán",
                  desc: "Người mua chọn 'Mua ngay' hoặc tham gia 'Đấu giá'. Sau khi thắng đấu giá hoặc chọn mua, người mua thực hiện thanh toán qua các cổng thanh toán tích hợp (VNPay, Momo, Chuyển khoản).",
                  icon: <CreditCard className="text-white" size={20} />,
                  color: "bg-green-500"
                },
                {
                  title: "Xử lý đơn hàng",
                  desc: "Người bán nhận thông báo và chuẩn bị hàng hóa trong vòng 24h. Đơn vị vận chuyển sẽ đến lấy hàng và cập nhật mã vận đơn lên hệ thống.",
                  icon: <Package className="text-white" size={20} />,
                  color: "bg-orange-500"
                },
                {
                  title: "Giao nhận & Kiểm tra",
                  desc: "Người mua nhận hàng từ đơn vị vận chuyển. AmazeBid khuyến khích người mua quay video mở hộp để làm bằng chứng nếu có khiếu nại.",
                  icon: <Truck className="text-white" size={20} />,
                  color: "bg-purple-500"
                },
                {
                  title: "Hoàn tất & Đánh giá",
                  desc: "Sau khi xác nhận hài lòng, tiền sẽ được giải ngân cho người bán. Người mua để lại đánh giá để xây dựng cộng đồng tin cậy.",
                  icon: <CheckCircle className="text-white" size={20} />,
                  color: "bg-emerald-500"
                }
              ].map((item, i) => (
                <div key={i} className="relative flex gap-8 items-start group">
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center shrink-0 z-10 shadow-lg group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex-1">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'khieu-nai':
        return (
          <div className="space-y-8 text-gray-700">
            <div className="text-center border-b pb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Giải quyết khiếu nại</h2>
              <p className="text-gray-500 font-medium">Cam kết bảo vệ quyền lợi khách hàng 24/7</p>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-red-900 font-bold">Hotline hỗ trợ khẩn cấp: 1900 8888</p>
                <p className="text-red-700 text-sm">Thời gian tiếp nhận: 8:00 - 22:00 hàng ngày.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { step: "Tiếp nhận", desc: "Khách hàng gửi yêu cầu khiếu nại qua ứng dụng hoặc email kèm theo mã đơn hàng và mô tả vấn đề." },
                { step: "Xác minh", desc: "AmazeBid yêu cầu các bằng chứng như ảnh chụp sản phẩm lỗi, video mở hộp hoặc biên bản đồng kiểm." },
                { step: "Hòa giải", desc: "Chúng tôi liên hệ với người bán để đối chất và đưa ra phương án xử lý công bằng nhất." },
                { step: "Phán quyết", desc: "Đưa ra quyết định cuối cùng: Hoàn tiền, đổi trả hoặc bồi thường thiệt hại trong vòng 3-5 ngày làm việc." }
              ].map((item, i) => (
                <div key={i} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bước {i + 1}</span>
                  <h4 className="font-bold text-gray-900 mt-1 mb-2">{item.step}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-900 text-white rounded-2xl">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Shield size={20} className="text-orange-400" /> Chính sách bảo vệ người mua
              </h4>
              <p className="text-sm text-gray-400 leading-relaxed">AmazeBid áp dụng chính sách "Thanh toán tạm giữ". Tiền của bạn chỉ được chuyển cho người bán khi bạn xác nhận đã nhận hàng và không có khiếu nại nào phát sinh trong vòng 3 ngày kể từ khi nhận hàng.</p>
            </div>
          </div>
        );
      case 'doi-tra':
        return (
          <div className="space-y-8 text-gray-700">
            <div className="text-center border-b pb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Chính sách đổi trả</h2>
              <p className="text-gray-500 font-medium">Đảm bảo quyền lợi mua sắm an tâm tuyệt đối</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                <p className="text-3xl font-black text-purple-600">07 Ngày</p>
                <p className="text-[10px] text-purple-400 uppercase font-bold tracking-widest">Thời hạn đổi trả</p>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                <p className="text-3xl font-black text-green-600">100%</p>
                <p className="text-[10px] text-green-400 uppercase font-bold tracking-widest">Hoàn tiền mặt</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                <p className="text-3xl font-black text-blue-600">24/7</p>
                <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Hỗ trợ xử lý</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="text-purple-600" /> 1. Điều kiện đổi trả
              </h3>
              <p className="text-sm">Khách hàng có quyền yêu cầu đổi trả sản phẩm trong vòng <strong>7 ngày</strong> kể từ khi nhận hàng thành công đối với các trường hợp sau:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Sản phẩm bị lỗi kỹ thuật hoặc hỏng hóc do nhà sản xuất.",
                  "Sản phẩm bị hư hỏng trong quá trình vận chuyển.",
                  "Sản phẩm giao không đúng mẫu mã, màu sắc hoặc kích thước đã đặt.",
                  "Sản phẩm là hàng giả, hàng nhái (hoàn tiền 200%)."
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 text-xs">
                    <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="text-purple-600" /> 2. Yêu cầu đối với sản phẩm
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Sản phẩm phải còn nguyên vẹn tem, mác, bao bì gốc (trừ trường hợp lỗi do vận chuyển).</li>
                <li>Sản phẩm chưa qua sử dụng, chưa giặt ủi hoặc có dấu hiệu can thiệp vật lý.</li>
                <li>Phải có đầy đủ hóa đơn, quà tặng kèm theo (nếu có).</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="text-purple-600" /> 3. Quy trình thực hiện
              </h3>
              <div className="space-y-4">
                {[
                  { title: "Gửi yêu cầu", desc: "Chụp ảnh/quay video sản phẩm lỗi và gửi yêu cầu đổi trả qua ứng dụng." },
                  { title: "Xác nhận", desc: "AmazeBid kiểm tra và phản hồi trong vòng 24h làm việc." },
                  { title: "Gửi hàng về", desc: "Khách hàng đóng gói và gửi hàng về địa chỉ người bán hoặc kho của AmazeBid." },
                  { title: "Hoàn tiền/Đổi mới", desc: "Sau khi kiểm tra hàng trả về, chúng tôi sẽ hoàn tiền hoặc gửi sản phẩm thay thế." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="font-bold text-gray-200 text-2xl italic">0{i + 1}</div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="p-4 bg-gray-900 text-white rounded-2xl text-center">
              <p className="text-xs text-gray-400">Lưu ý: Phí vận chuyển đổi trả sẽ do Người bán chịu nếu lỗi thuộc về sản phẩm hoặc người bán. Trường hợp đổi trả theo nhu cầu cá nhân, Người mua sẽ chịu phí vận chuyển.</p>
            </div>
          </div>
        );
      case 'lien-he':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Phone className="text-blue-600" /> Liên hệ với chúng tôi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Địa chỉ</h4>
                    <p className="text-gray-600 text-sm">123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Hotline</h4>
                    <p className="text-gray-600 text-sm">1900 1234 (8:00 - 22:00)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">Email</h4>
                    <p className="text-gray-600 text-sm">support@amazebid.vn</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold mb-4">Gửi tin nhắn cho chúng tôi</h4>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" placeholder="Họ và tên" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="email" placeholder="Email" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                  <textarea placeholder="Nội dung tin nhắn" rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                  <button className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">Gửi yêu cầu</button>
                </form>
              </div>
            </div>
          </div>
        );
      case 'an-toan-thanh-toan':
        return (
          <div className="space-y-8 text-gray-700">
            <div className="text-center border-b pb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">An toàn thanh toán</h2>
              <p className="text-gray-500 font-medium">Hệ thống bảo mật giao dịch đa lớp tại AmazeBid</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center space-y-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                  <Shield size={24} />
                </div>
                <h4 className="font-bold text-blue-900">Bảo mật 256-bit</h4>
                <p className="text-xs text-blue-700">Mã hóa toàn bộ thông tin giao dịch bằng công nghệ SSL tiên tiến nhất.</p>
              </div>
              <div className="p-6 bg-green-50 rounded-2xl border border-green-100 text-center space-y-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                  <Lock size={24} />
                </div>
                <h4 className="font-bold text-green-900">Thanh toán Escrow</h4>
                <p className="text-xs text-green-700">Tiền chỉ được giải ngân cho người bán khi bạn xác nhận đã nhận hàng.</p>
              </div>
              <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 text-center space-y-3">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                  <CheckCircle size={24} />
                </div>
                <h4 className="font-bold text-orange-900">Xác thực 2 lớp</h4>
                <p className="text-xs text-orange-700">Yêu cầu mã OTP cho mọi giao dịch thanh toán giá trị cao.</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="text-blue-600" /> 1. Các phương thức thanh toán hỗ trợ
              </h3>
              <p className="text-sm">AmazeBid hợp tác với các đối tác tài chính uy tín để đảm bảo dòng tiền của bạn luôn an toàn:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Thẻ Quốc tế (Visa/Master)', 'Ví điện tử Momo', 'Cổng VNPay', 'Chuyển khoản Ngân hàng'].map((method, i) => (
                  <div key={i} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-center text-xs font-medium shadow-sm">
                    {method}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="text-blue-600" /> 2. Quy trình thanh toán tạm giữ (Escrow)
              </h3>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                <p className="text-sm leading-relaxed">Để bảo vệ người mua, AmazeBid áp dụng quy trình thanh toán trung gian:</p>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                    <p className="text-xs text-gray-600">Người mua thanh toán tiền đơn hàng cho AmazeBid.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                    <p className="text-xs text-gray-600">AmazeBid thông báo cho người bán và giữ tiền trong hệ thống tạm giữ.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                    <p className="text-xs text-gray-600">Người bán giao hàng. Người mua nhận hàng và kiểm tra.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</div>
                    <p className="text-xs text-gray-600">Sau khi người mua xác nhận hài lòng (hoặc sau 3 ngày không khiếu nại), AmazeBid giải ngân tiền cho người bán.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="text-orange-600" /> 3. Khuyến cáo an toàn
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                <li><strong>Không giao dịch ngoài sàn:</strong> Tuyệt đối không chuyển khoản trực tiếp cho người bán mà không qua hệ thống AmazeBid. Chúng tôi không thể bảo vệ bạn nếu giao dịch diễn ra ngoài nền tảng.</li>
                <li><strong>Bảo mật mã OTP:</strong> Không bao giờ cung cấp mã OTP hoặc mật khẩu thanh toán cho bất kỳ ai, kể cả nhân viên AmazeBid.</li>
                <li><strong>Kiểm tra website:</strong> Luôn đảm bảo bạn đang giao dịch trên đúng tên miền chính thức của AmazeBid.</li>
              </ul>
            </section>

            <div className="p-6 bg-blue-900 text-white rounded-2xl flex items-center gap-6 shadow-xl">
              <Shield size={40} className="text-blue-400 shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Bảo hiểm giao dịch AmazeBid</h4>
                <p className="text-xs text-blue-200 leading-relaxed">Mọi giao dịch thanh toán qua sàn đều được bảo hiểm 100% giá trị trong trường hợp có gian lận hoặc sai sót hệ thống.</p>
              </div>
            </div>
          </div>
        );
      case 'dieu-khoan-dich-vu':
        return (
          <div className="space-y-8 text-gray-700 pb-12">
            <div className="text-center border-b pb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Điều khoản Dịch vụ</h2>
              <p className="text-gray-500 font-medium">(Terms of Service – TOS)</p>
            </div>
            
            {/* 1. Giới thiệu */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">1</span>
                Giới thiệu
              </h3>
              <p className="leading-relaxed">
                AmazeBid là nền tảng hỗ trợ bán hàng và tạo nội dung bằng AI, cung cấp công cụ để người bán đăng sản phẩm, tạo nội dung marketing, quản lý đơn hàng và tối ưu hiệu suất kinh doanh. Khi sử dụng AmazeBid, người dùng đồng ý tuân thủ toàn bộ Điều khoản Dịch vụ này.
              </p>
            </section>

            {/* 2. Định nghĩa */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">2</span>
                Định nghĩa
              </h3>
              <ul className="space-y-3 pl-2">
                <li className="flex gap-2"><strong>Nền tảng:</strong> <span>AmazeBid và toàn bộ hệ thống liên quan.</span></li>
                <li className="flex gap-2"><strong>Người bán:</strong> <span>Cá nhân hoặc tổ chức đăng sản phẩm và kinh doanh trên AmazeBid.</span></li>
                <li className="flex gap-2"><strong>Nội dung AI:</strong> <span>Hình ảnh, video, mô tả, kịch bản livestream và các tài liệu được tạo bởi hệ thống AI của AmazeBid.</span></li>
                <li className="flex gap-2"><strong>Phí dịch vụ:</strong> <span>Khoản phí AmazeBid thu từ người bán theo mô hình đã công bố.</span></li>
              </ul>
            </section>

            {/* 3. Phạm vi dịch vụ */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">3</span>
                Phạm vi dịch vụ
              </h3>
              <p>AmazeBid cung cấp một hệ sinh thái dịch vụ toàn diện nhằm hỗ trợ người bán tối ưu hóa hoạt động kinh doanh trên nền tảng thương mại điện tử, bao gồm:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-sm text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm italic text-gray-500 mt-4">AmazeBid cam kết cung cấp dịch vụ với chất lượng cao, liên tục cải tiến và mở rộng tính năng để đáp ứng nhu cầu phát triển kinh doanh của người bán trong từng giai đoạn.</p>
            </section>

            {/* 4. Quyền và nghĩa vụ */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">4</span>
                Quyền và nghĩa vụ của các bên
              </h3>
              
              <div className="space-y-8 pl-4 border-l-2 border-gray-100">
                {/* 4.1 Người bán */}
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-gray-800">4.1 Quyền của người bán</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Sử dụng đầy đủ tính năng của nền tảng theo gói dịch vụ.</li>
                    <li>Sở hữu toàn bộ quyền khai thác thương mại đối với nội dung AI được tạo cho sản phẩm của mình.</li>
                    <li>Yêu cầu hỗ trợ kỹ thuật khi cần.</li>
                  </ul>
                  
                  <h4 className="font-bold text-lg text-gray-800">4.2 Nghĩa vụ của người bán</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Cung cấp thông tin sản phẩm trung thực, chính xác và hợp pháp.</li>
                    <li>Chịu trách nhiệm đầy đủ về nguồn gốc, chất lượng, an toàn và tính pháp lý của sản phẩm.</li>
                    <li>Không đăng tải nội dung vi phạm pháp luật, bản quyền, quyền sở hữu trí tuệ.</li>
                    <li>Thanh toán đầy đủ và đúng hạn các khoản phí dịch vụ theo quy định.</li>
                    <li>Tuân thủ đầy đủ các quy định về thuế và nghĩa vụ tài chính theo pháp luật Việt Nam.</li>
                    <li>Bảo mật thông tin đăng nhập tài khoản và chịu trách nhiệm về mọi hoạt động phát sinh.</li>
                    <li>Tuân thủ các quy định về bảo vệ quyền lợi người tiêu dùng.</li>
                    <li>Hợp tác với AmazeBid trong việc xử lý các khiếu nại, tranh chấp phát sinh.</li>
                    <li>Không sử dụng nền tảng cho các hoạt động bất hợp pháp, gian lận, lừa đảo.</li>
                  </ul>
                </div>

                {/* 4.3 Người mua */}
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-gray-800">4.3 Quyền và nghĩa vụ của người mua</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <p className="font-bold text-blue-900 text-sm mb-3">4.3.1 Quyền của người mua</p>
                      <ul className="text-xs space-y-2 text-blue-800">
                        <li>• Được tiếp cận đầy đủ thông tin về sản phẩm, giá cả, chính sách bảo hành.</li>
                        <li>• Được sử dụng dịch vụ mua hàng an toàn, minh bạch và thuận tiện.</li>
                        <li>• Được bảo vệ quyền lợi theo quy định của pháp luật.</li>
                        <li>• Được khiếu nại, yêu cầu hỗ trợ và giải quyết tranh chấp.</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="font-bold text-gray-900 text-sm mb-3">4.3.2 Nghĩa vụ của người mua</p>
                      <ul className="text-xs space-y-2 text-gray-700">
                        <li>• Cung cấp thông tin chính xác, đầy đủ khi đăng ký và giao dịch.</li>
                        <li>• Thanh toán đầy đủ và đúng hạn các khoản phí liên quan.</li>
                        <li>• Tuân thủ các quy định về sử dụng dịch vụ và các chính sách của sàn.</li>
                        <li>• Hợp tác trong việc giải quyết khiếu nại, tranh chấp nếu phát sinh.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 4.4 Đơn vị vận chuyển */}
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-gray-800">4.4 Quyền và nghĩa vụ của các đơn vị vận chuyển</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="font-bold text-green-900 text-sm mb-3">4.4.1 Quyền của đơn vị vận chuyển</p>
                      <ul className="text-xs space-y-2 text-green-800">
                        <li>• Được cung cấp đầy đủ thông tin về đơn hàng và địa chỉ giao nhận.</li>
                        <li>• Được nhận thanh toán đúng hạn theo thỏa thuận hợp đồng.</li>
                        <li>• Được yêu cầu hỗ trợ và phối hợp để thực hiện giao hàng hiệu quả.</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="font-bold text-gray-900 text-sm mb-3">4.4.2 Nghĩa vụ của đơn vị vận chuyển</p>
                      <ul className="text-xs space-y-2 text-gray-700">
                        <li>• Thực hiện giao hàng đúng thời gian, địa điểm và điều kiện thỏa thuận.</li>
                        <li>• Bảo quản hàng hóa an toàn và nguyên vẹn trong quá trình vận chuyển.</li>
                        <li>• Thông báo kịp thời khi có sự cố phát sinh.</li>
                        <li>• Bảo mật thông tin đơn hàng và khách hàng.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. AmazeBid */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">5</span>
                Quyền và nghĩa vụ của AmazeBid
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="font-bold text-gray-800">5.1 Quyền của AmazeBid</p>
                  <ul className="list-disc pl-5 text-sm space-y-2">
                    <li>Thu phí dịch vụ theo mô hình đã công bố.</li>
                    <li>Tạm ngưng hoặc khóa tài khoản vi phạm.</li>
                    <li>Cập nhật, thay đổi hoặc nâng cấp tính năng.</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-gray-800">5.2 Nghĩa vụ của AmazeBid</p>
                  <ul className="list-disc pl-5 text-sm space-y-2">
                    <li>Cung cấp dịch vụ ổn định, minh bạch.</li>
                    <li>Bảo mật thông tin người dùng theo quy định pháp luật.</li>
                    <li>Công bố rõ ràng mọi loại phí và cách tính phí.</li>
                    <li>Hỗ trợ người bán trong quá trình sử dụng nền tảng.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. Phí dịch vụ */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">6</span>
                Phí dịch vụ và thanh toán
              </h3>
              <p className="text-sm">AmazeBid thu phí dịch vụ theo phần trăm lợi nhuận hoặc theo mô hình được công bố trong từng giai đoạn. Cụ thể:</p>
              
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-bold">Mô hình tính phí</th>
                      <th className="px-4 py-3 font-bold">Mô tả</th>
                      <th className="px-4 py-3 font-bold">Ví dụ minh họa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3 font-bold">Phần trăm lợi nhuận</td>
                      <td className="px-4 py-3">AmazeBid thu một tỷ lệ phần trăm (%) trên lợi nhuận thu được từ mỗi giao dịch bán hàng.</td>
                      <td className="px-4 py-3">Nếu lợi nhuận là 1.000.000 VND và tỷ lệ phí là 5%, phí dịch vụ là 50.000 VND.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold">Phí cố định theo giai đoạn</td>
                      <td className="px-4 py-3">Áp dụng mức phí cố định hoặc biểu phí khác nhau tùy theo chương trình khuyến mãi.</td>
                      <td className="px-4 py-3">Giai đoạn khởi động có thể miễn phí hoặc phí thấp.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Cách tính phí dịch vụ</h4>
                <p className="text-sm">Phí dịch vụ được tính tự động dựa trên dữ liệu giao dịch thực tế. AmazeBid có quyền điều chỉnh tỷ lệ phần trăm phù hợp với từng giai đoạn và sẽ công bố minh bạch.</p>
                
                <div className="bg-gray-900 text-white p-6 rounded-xl space-y-4">
                  <h4 className="font-bold text-orange-400">Công thức tính phí dịch vụ</h4>
                  <div className="font-mono text-center py-4 bg-white/10 rounded-lg">
                    Phí dịch vụ = Lợi nhuận × Tỷ lệ phần trăm phí
                  </div>
                  <p className="text-xs text-gray-400 italic">Trong đó: Lợi nhuận = Doanh thu - Chi phí</p>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="font-bold text-sm">Ví dụ cụ thể (Tính phí theo % lợi nhuận):</h4>
                  <div className="text-sm space-y-1">
                    <p>• Doanh thu: 10.000.000 VND</p>
                    <p>• Chi phí: 7.000.000 VND</p>
                    <p>• Tỷ lệ phí dịch vụ: 5% (0.05)</p>
                    <p className="font-bold mt-2">Lợi nhuận = 10.000.000 - 7.000.000 = 3.000.000 VND</p>
                    <p className="font-bold text-blue-600">Phí dịch vụ = 3.000.000 × 0.05 = 150.000 VND</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-3">
                <h4 className="font-bold text-blue-900">Quy trình thanh toán & Cam kết</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• AmazeBid khấu trừ trực tiếp phí dịch vụ từ doanh thu hoặc gửi yêu cầu thanh toán định kỳ.</li>
                  <li>• AmazeBid cam kết không thu bất kỳ khoản phí ẩn nào ngoài các khoản đã công bố.</li>
                  <li>• Mọi thay đổi về phí dịch vụ sẽ được thông báo trước ít nhất 15 ngày.</li>
                  <li>• Tranh chấp về phí sẽ được ưu tiên giải quyết thông qua thương lượng và hòa giải.</li>
                </ul>
              </div>
            </section>

            {/* 7. Nội dung AI */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">7</span>
                Nội dung AI và quyền sở hữu trí tuệ
              </h3>
              <div className="space-y-4 text-sm leading-relaxed">
                <p><strong>7.1 Nội dung AI:</strong> Là nội dung gốc, phát triển dựa trên công nghệ AI tiên tiến, không sao chép. AmazeBid cam kết đảm bảo tính độc đáo và bản quyền của nội dung AI.</p>
                <p><strong>7.2 Quyền sở hữu trí tuệ:</strong> Người bán sở hữu toàn bộ quyền sử dụng, khai thác thương mại đối với nội dung AI được tạo cho sản phẩm của mình. Người bán có quyền sao chép, chỉnh sửa, phân phối và quảng bá nội dung này.</p>
                <p><strong>7.3 Cam kết và trách nhiệm:</strong> Người bán cam kết sử dụng nội dung AI hợp pháp. AmazeBid không chịu trách nhiệm về các hành vi vi phạm bản quyền do người bán gây ra khi sử dụng nội dung AI sai mục đích.</p>
              </div>
            </section>

            {/* 8. Hành vi bị cấm */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">8</span>
                Hành vi bị cấm
              </h3>
              <p className="text-sm">AmazeBid nghiêm cấm các hành vi sau nhằm đảm bảo môi trường kinh doanh minh bạch:</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  "Đăng tải, rao bán sản phẩm giả mạo, hàng nhái, vi phạm sở hữu trí tuệ.",
                  "Sử dụng tài sản trí tuệ của người khác mà không có sự cho phép hợp pháp.",
                  "Tải lên hoặc chia sẻ nội dung sao chép từ Google hoặc nguồn không rõ ràng bản quyền.",
                  "Tạo hoặc phát tán nội dung mô phỏng người nổi tiếng (deepfake) trái phép.",
                  "Lợi dụng nền tảng để thực hiện các hành vi gian lận, lừa đảo, chiếm đoạt tài sản.",
                  "Đăng tải nội dung khiêu dâm, bạo lực, kích động thù địch, phân biệt chủng tộc.",
                  "Phát tán mã độc (malware), virus, trojan, ransomware, spyware.",
                  "Thao túng, can thiệp trái phép vào hệ thống, dữ liệu của AmazeBid hoặc người dùng khác.",
                  "Thực hiện các hành vi vi phạm pháp luật Việt Nam (Rửa tiền, buôn bán hàng cấm...)."
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100 text-red-800 text-sm font-medium">
                    <Shield size={16} className="shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic">AmazeBid có quyền tạm ngưng hoặc chấm dứt tài khoản của người dùng vi phạm mà không cần báo trước.</p>
            </section>

            {/* 9. Thuế và pháp lý */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">9</span>
                Thuế và nghĩa vụ pháp lý
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-gray-500">9.1 Căn cứ pháp lý</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">Luật Thương mại điện tử 2025</p>
                      <p className="text-gray-600">Quy định về trách nhiệm của thương nhân, tổ chức cung cấp dịch vụ sàn giao dịch TMĐT.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">Bộ luật Dân sự 2015</p>
                      <p className="text-gray-600">Quy định về giao dịch dân sự, hợp đồng và trách nhiệm bồi thường thiệt hại.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">Luật Thuế (VAT, TNCN, TNDN)</p>
                      <p className="text-gray-600">Quy định về nghĩa vụ kê khai, nộp thuế đối với hoạt động kinh doanh trên nền tảng số.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900">Luật Bảo vệ người tiêu dùng 2023</p>
                      <p className="text-gray-600">Quy định về quyền lợi và trách nhiệm bảo vệ người mua hàng trực tuyến.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <p><strong>9.2 Nghĩa vụ thuế:</strong> Người bán có nghĩa vụ tự kê khai và nộp đầy đủ các loại thuế phát sinh từ hoạt động kinh doanh trên AmazeBid theo quy định của cơ quan thuế. AmazeBid không chịu trách nhiệm về các sai sót hoặc vi phạm về thuế của người bán.</p>
                  <p><strong>9.3 Khấu trừ tại nguồn:</strong> Trong trường hợp pháp luật quy định, AmazeBid có quyền khấu trừ tiền thuế tại nguồn từ doanh thu của người bán để nộp vào ngân sách nhà nước.</p>
                  <p><strong>9.4 Cung cấp thông tin:</strong> AmazeBid có nghĩa vụ cung cấp thông tin về tình hình kinh doanh của người bán cho cơ quan chức năng khi có yêu cầu hợp pháp để phục vụ công tác quản lý thuế và thanh tra.</p>
                  <p><strong>9.5 Hóa đơn chứng từ:</strong> Người bán có trách nhiệm xuất hóa đơn cho người mua theo quy định. AmazeBid cung cấp công cụ hỗ trợ quản lý hóa đơn điện tử nếu người bán có nhu cầu.</p>
                  <p><strong>9.6 Tuân thủ pháp luật:</strong> Các bên cam kết thực hiện đúng các quy định về thương mại, cạnh tranh lành mạnh và không thực hiện các hành vi trục lợi chính sách.</p>
                </div>
              </div>
            </section>

            {/* 10. Bảo mật thông tin */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">10</span>
                Bảo mật thông tin
              </h3>
              <div className="space-y-4 text-sm leading-relaxed">
                <p><strong>10.1 Chính sách bảo mật:</strong> AmazeBid cam kết bảo mật tuyệt đối thông tin cá nhân và dữ liệu kinh doanh của người dùng theo Luật An toàn thông tin mạng và các tiêu chuẩn quốc tế.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-bold text-blue-900 mb-2">Dữ liệu thu thập</p>
                    <ul className="text-xs space-y-1 text-blue-800">
                      <li>• Thông tin định danh (Tên, MST, CCCD)</li>
                      <li>• Thông tin liên lạc (SĐT, Email, Địa chỉ)</li>
                      <li>• Thông tin thanh toán và giao dịch</li>
                      <li>• Dữ liệu hành vi và kỹ thuật (IP, Cookies)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="font-bold text-green-900 mb-2">Mục đích sử dụng</p>
                    <ul className="text-xs space-y-1 text-green-800">
                      <li>• Cung cấp và duy trì dịch vụ</li>
                      <li>• Xử lý đơn hàng và thanh toán</li>
                      <li>• Hỗ trợ khách hàng và giải quyết khiếu nại</li>
                      <li>• Cải thiện trải nghiệm và phát triển tính năng</li>
                    </ul>
                  </div>
                </div>
                <p><strong>10.2 Biện pháp bảo vệ:</strong> Chúng tôi sử dụng công nghệ mã hóa SSL/TLS, tường lửa đa lớp và hệ thống giám sát 24/7 để ngăn chặn các truy cập trái phép.</p>
                <p><strong>10.3 Quyền của chủ thể dữ liệu:</strong> Người dùng có quyền truy cập, yêu cầu chỉnh sửa, xóa hoặc phản đối việc xử lý dữ liệu cá nhân của mình bất kỳ lúc nào thông qua cài đặt tài khoản hoặc liên hệ hỗ trợ.</p>
                <p><strong>10.4 Lưu trữ dữ liệu:</strong> Dữ liệu được lưu trữ trên hệ thống máy chủ an toàn và chỉ được giữ lại trong khoảng thời gian cần thiết để thực hiện các mục đích đã nêu hoặc theo yêu cầu của pháp luật.</p>
                <p><strong>10.5 Cam kết không chia sẻ:</strong> AmazeBid cam kết không bán, cho thuê hoặc chia sẻ dữ liệu người dùng cho bên thứ ba vì mục đích thương mại mà không có sự đồng ý của người dùng.</p>
              </div>
            </section>

            {/* 11. Giới hạn trách nhiệm */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">11</span>
                Giới hạn trách nhiệm
              </h3>
              <div className="space-y-4 text-sm leading-relaxed">
                <p><strong>11.1 Miễn trừ trách nhiệm:</strong> AmazeBid không chịu trách nhiệm về bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc hệ quả nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.</p>
                <p><strong>11.2 Tranh chấp giữa các bên:</strong> AmazeBid đóng vai trò là nền tảng trung gian. Mọi tranh chấp về chất lượng hàng hóa, thanh toán hoặc giao nhận giữa người bán và người mua sẽ do các bên tự giải quyết.</p>
                <p><strong>11.3 Sự cố bất khả kháng:</strong> AmazeBid được miễn trách nhiệm trong các trường hợp thiên tai, dịch bệnh, sự cố hạ tầng viễn thông quốc gia hoặc các tình huống nằm ngoài khả năng kiểm soát hợp lý.</p>
                <p><strong>11.4 Nội dung bên thứ ba:</strong> Nền tảng có thể chứa liên kết đến các trang web khác. AmazeBid không chịu trách nhiệm về nội dung hoặc chính sách bảo mật của các bên thứ ba này.</p>
              </div>
            </section>

            {/* 12. Tạm ngưng và chấm dứt */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">12</span>
                Tạm ngưng và chấm dứt dịch vụ
              </h3>
              <div className="space-y-4 text-sm leading-relaxed">
                <p><strong>12.1 Quyền của AmazeBid:</strong> Chúng tôi có quyền tạm khóa hoặc xóa vĩnh viễn tài khoản nếu phát hiện hành vi vi phạm nghiêm trọng Điều khoản dịch vụ hoặc có dấu hiệu gian lận, lừa đảo.</p>
                <p><strong>12.2 Quyền của người dùng:</strong> Người dùng có thể yêu cầu đóng tài khoản và chấm dứt sử dụng dịch vụ bất kỳ lúc nào sau khi đã hoàn tất các nghĩa vụ tài chính và đơn hàng đang xử lý.</p>
                <p><strong>12.3 Hệ quả của việc chấm dứt:</strong> Khi tài khoản bị chấm dứt, người dùng sẽ mất quyền truy cập vào các dữ liệu và nội dung AI đã tạo trên nền tảng. Các khoản phí đã thanh toán sẽ không được hoàn lại trừ trường hợp có thỏa thuận khác.</p>
              </div>
            </section>

            {/* 13. Thay đổi TOS */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">13</span>
                Thay đổi Điều khoản Dịch vụ
              </h3>
              <p className="text-sm leading-relaxed">
                AmazeBid có quyền cập nhật, sửa đổi hoặc thay thế bất kỳ phần nào của Điều khoản Dịch vụ này vào bất kỳ lúc nào. Mọi thay đổi sẽ có hiệu lực ngay khi được đăng tải trên nền tảng. Người dùng có trách nhiệm thường xuyên kiểm tra TOS để cập nhật các thay đổi. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới đó.
              </p>
            </section>

            {/* 14. Luật áp dụng */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">14</span>
                Luật áp dụng và Giải quyết tranh chấp
              </h3>
              <div className="space-y-3 text-sm leading-relaxed">
                <p><strong>14.1 Luật áp dụng:</strong> Điều khoản Dịch vụ này được điều chỉnh và giải thích theo pháp luật của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</p>
                <p><strong>14.2 Giải quyết tranh chấp:</strong> Mọi tranh chấp phát sinh từ hoặc liên quan đến Điều khoản này sẽ được ưu tiên giải quyết thông qua thương lượng và hòa giải giữa các bên. Trong trường hợp không thể đạt được thỏa thuận trong vòng 30 ngày, tranh chấp sẽ được đưa ra giải quyết tại Tòa án có thẩm quyền tại Việt Nam.</p>
              </div>
            </section>

            {/* 15. Xác nhận */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm">15</span>
                Xác nhận và Chấp thuận
              </h3>
              <div className="p-6 bg-gray-900 text-white rounded-2xl space-y-4 shadow-xl">
                <p className="text-sm leading-relaxed text-gray-300">
                  Bằng việc đăng ký tài khoản hoặc sử dụng bất kỳ dịch vụ nào của AmazeBid, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi toàn bộ các điều khoản và điều kiện quy định trong Điều khoản Dịch vụ này, cũng như các chính sách bảo mật và quy chế hoạt động của chúng tôi.
                </p>
                <div className="pt-4 border-t border-white/10 flex flex-col items-center">
                  <p className="text-lg font-black uppercase tracking-widest text-orange-400">Tôi đã đọc và đồng ý</p>
                  <p className="text-[10px] text-gray-500 mt-1">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </section>
          </div>
        );


      default:
        return <div>Trang không tồn tại.</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Gavel className="text-[#febd69]" />
            <span className="font-bold text-lg">AmazeBid Service</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <RefreshCw size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessPages;
