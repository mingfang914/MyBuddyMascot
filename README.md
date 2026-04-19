# My Buddy Mascot

**My Buddy Mascot** là một extension trình duyệt độc đáo, mang đến một người bạn đồng hành kỹ thuật số (mascot) với tính cách phức tạp và khả năng tương tác phong phú. Mascot được xây dựng bằng công nghệ Pixel Art tạo hình bằng code (`sprites.js`) và sở hữu một hệ thống xử lý trung tâm mạnh mẽ.

## 🌟 Tính Năng Nổi Bật

### 1. 🎭 Tính Cách Đa Diện (Tsundere Personality)
Sở hữu tính cách **Tsundere** (ngoài lạnh trong nóng):
- **Giai đoạn đầu**: Tỏ ra khó chịu, bực bội hoặc thờ ơ khi bị làm phiền.
- **Phản ứng**: Có thể la mắng hoặc xua đuổi người dùng qua các câu hội thoại được trọng số hóa.
- **Tương tác**: Hệ thống hội thoại thông minh dựa trên ngữ cảnh thực tế của người dùng.

### 2. 🌦️ Hiệu Ứng Thời Tiết (Seasonal Weather)
- **Điều khiển thủ công**: Người dùng có thể kích hoạt các hiệu ứng Mùa Xuân (Hoa anh đào), Mùa Hạ (Nắng vàng), Mùa Thu (Lá rụng), và Mùa Đông (Tuyết rơi) thông qua Control Panel.
- **Lớp hiển thị riêng**: Hiệu ứng thời tiết chạy trên một layer độc lập (`WeatherEngine`) để đảm bảo hiệu suất.

### 3. 💬 Hệ Thống Tương Tác Thông Minh (Heuristic Detection)
Mascot không chỉ đứng yên, nó theo dõi và phản hồi lại hầu hết hành vi trên trình duyệt:
- **Tương tác Web**:
  - **Link/Button**: Nhận biết khi nào người dùng đang phân vân trước một liên kết hoặc chuẩn bị ấn nút Submit.
  - **Images/Media**: Tò mò khi người dùng ngắm nhìn một bức ảnh hoặc video.
  - **AI Context**: Phản ứng khi người dùng đang hỏi chuyện ChatGPT, Gemini hoặc Claude.
  - **Site Context**: Có lời thoại riêng khi truy cập YouTube, Facebook, GitHub, StackOverflow hoặc tìm kiếm trên Google.
- **Hành vi cá nhân**:
  - **Highlight**: Phản ứng khi người dùng bôi đen đoạn văn bản dài.
  - **Password**: "Tế nhị" ngoảnh mặt đi hoặc nhắc nhở khi người dùng tập trung nhập mật khẩu.
  - **Drag & Drop**: Phản ứng khi người dùng kéo thả file ảnh vào trình duyệt.

### 4. ⚙️ Hệ Thống Quản Lý Mascot (MascotManager)
- **Centralized Event System**: Tất cả các trình lắng nghe sự kiện được quản lý tập trung để tránh lặp hội thoại.
- **Multi-Mascot Support**: Hỗ trợ tối đa 3 Mascot cùng lúc với hệ thống **Bubble Stacking** (bong bóng chat tự động xếp lớp không đè lên nhau).
- **Collision Physics**: Mascot có thể va chạm và "cãi nhau" với nhau.

## 🛠️ Cài Đặt (Developer Mode)

1. Tải mã nguồn về máy. Sau đó tiến hành giải nén thư mục.
2. Mở Chrome, hoặc Edge truy cập `chrome://extensions` hoặc `edge://extensions`. Hoặc click chuột phải vào biểu tượng extension trên thanh Taskbar và chọn **Manage extensions**.
3. Bật **Developer mode**. Chọn **Load unpacked** và trỏ đến thư mục gốc của dự án đã giải nén.
4. Hãy thử vào trang web bất kỳ trải nghiệm.

## 🚀 Cách Sử Dụng

- **Kéo thả**: Nhấn giữ Mascot để di chuyển.
- **Menu chuột phải**: Click chuột phải vào Mascot để mở Control Panel (Cài đặt thời tiết, hành động xoa đầu, nhân bản...).
- **Cài đặt bật/tắt**: Sử dụng biểu tượng Extension trên thanh Taskbar để bật/tắt toàn cục hoặc chặn Mascot trên từng trang web cụ thể.

