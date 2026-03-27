# MovieWeb
https://minhmvp.github.io/MovieWeb/

Web làm phim coi miễn phí, không quảng cáo
# 🎬 LUMIÈRE — Premium Cinema Streaming Platform

![UI/UX Design](https://img.shields.io/badge/UI%2FUX-Cinematic%20Dark%20Theme-080810)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-Semantic-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Glassmorphism-1572B6?logo=css3&logoColor=white)

LUMIÈRE là một ứng dụng web xem phim trực tuyến mang phong cách điện ảnh (Cinematic), được lấy cảm hứng từ trải nghiệm người dùng cao cấp của Netflix và Apple TV+. Dự án tập trung mạnh vào chất lượng UI/UX, tích hợp dữ liệu phim động từ API và tối ưu hóa hiệu năng frontend.

## ✨ Tính năng nổi bật (Key Features)

- **Giao diện Cinematic & Glassmorphism:** Thiết kế Dark Mode sang trọng, hiệu ứng làm mờ (blur), đổ bóng neon và layout hiện đại.
- **Tích hợp API Thực Tế:** Lấy dữ liệu phim mới nhất, thể loại, quốc gia trực tiếp từ `vsmov API`.
- **Theater Mode (Chế độ Rạp Chiếu):** Tích hợp trình phát video toàn màn hình không quảng cáo, mang lại trải nghiệm xem phim đắm chìm.
- **Smart Search (Tìm kiếm thông minh):** Áp dụng kỹ thuật **Debounce** (Rate Limiting) để tối ưu hóa số lượng API request khi người dùng gõ từ khóa.
- **Quản lý Danh sách phim (Watchlist):** Lưu trữ phim yêu thích ngay trên trình duyệt bằng `LocalStorage`.
- **Lọc phim đa dạng:** Phân loại phim theo Thể loại, Hoạt hình, Quốc gia với dữ liệu tải động (Lazy Fetching).

## 🛠 Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng hoàn toàn bằng **Vanilla Technologies** (thuần túy), không phụ thuộc vào các framework nặng nề, nhằm chứng minh khả năng kiểm soát DOM và Javascript cốt lõi:

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Architecture:** Separation of Concerns (Tách biệt HTML, CSS và JS ra các file độc lập).
- **Data Fetching:** Fetch API, Async/Await.
- **Storage:** Browser LocalStorage.

## ⚙️ Cấu trúc thư mục (Folder Structure)

```text
📦 cinematic-stream
 ┣ 📜 index.html   # Cấu trúc giao diện và Layout chính
 ┣ 📜 style.css    # Hệ thống Design System, Animation & CSS Variables
 ┣ 📜 script.js    # Logic gọi API, xử lý sự kiện và DOM Manipulation
 ┗ 📜 README.md    # Tài liệu dự án
