# Recashly Mobile App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](#english) | [Bahasa Indonesia](#bahasa-indonesia)

---

<a name="english"></a>
## 🇬🇧 English

**Recashly** is a mobile application built with **React Native** and **Expo** designed to streamline the process of submitting and managing expense reimbursements. It features offline capabilities, image optimization for receipts, and a user-friendly interface for tracking reimbursement status.

### 📸 Screenshots

| Login | Dashboard | New Reimbursement | History |
|:---:|:---:|:---:|:---:|
| <img src="path/to/login.png" width="200" alt="Login Screen" /> | <img src="path/to/dashboard.png" width="200" alt="Dashboard" /> | <img src="path/to/form.png" width="200" alt="New Reimbursement" /> | <img src="path/to/history.png" width="200" alt="History" /> |

> *Note: Please update the image paths above with actual screenshots of your application.*

### ✨ Features

- **Offline Support**: Submit reimbursements even without an internet connection. Data is synced automatically when online.
- **Receipt Capture**: Take photos of receipts directly within the app or upload from the gallery.
- **Image Optimization**: Automatic compression of receipt images to save bandwidth and storage.
- **History & Status**: View reimbursement history and track the status of current submissions (Pending, Approved, Paid).
- **Secure Authentication**: Secure login system integrated with the backend API.

### 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Design System**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Networking**: Axios
- **Offline Storage**: Expo File System & SQLite (implied for robust offline apps, adjusting based on actual usage e.g. Async Storage/Zustand persist)

### 🚀 Getting Started

#### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your Android/iOS device (for testing)

#### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/recashly-mobile.git
   cd recashly-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory (if required) and configure your backend API URL.
   ```env
   EXPO_PUBLIC_API_URL=http://your-backend-url/api
   ```

#### Running the App

Start the development server:

```bash
npx expo start
```

- **Scan the QR code** with the **Expo Go** app (Android) or **Camera** app (iOS).
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator.
- Press `w` to open in Web Browser.

### 📱 Building for Production

To create a production build (APK/IPA):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build -p android --profile preview

# Build for iOS
eas build -p ios --profile preview
```

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<a name="bahasa-indonesia"></a>
## 🇮🇩 Bahasa Indonesia

**Recashly** adalah aplikasi mobile yang dibangun menggunakan **React Native** dan **Expo**, dirancang untuk mempermudah proses pengajuan dan pengelolaan klaim reimbursement (penggantian biaya). Aplikasi ini memiliki fitur offline, optimasi gambar untuk struk, dan antarmuka yang mudah digunakan untuk memantau status pengajuan.

### 📸 Tangkapan Layar

| Login | Beranda | Pengajuan Baru | Riwayat |
|:---:|:---:|:---:|:---:|
| <img src="path/to/login.png" width="200" alt="Layar Login" /> | <img src="path/to/dashboard.png" width="200" alt="Beranda" /> | <img src="path/to/form.png" width="200" alt="Form Pengajuan" /> | <img src="path/to/history.png" width="200" alt="Riwayat" /> |

> *Catatan: Mohon perbarui path gambar di atas dengan tangkapan layar aplikasi yang sebenarnya.*

### ✨ Fitur Utama

- **Mode Offline**: Ajukan reimbursement meski tanpa koneksi internet. Data akan disinkronisasi secara otomatis saat online kembali.
- **Foto Struk**: Ambil foto struk langsung dari aplikasi atau unggah dari galeri.
- **Optimasi Gambar**: Kompresi otomatis gambar struk untuk menghemat bandwidth dan penyimpanan.
- **Riwayat & Status**: Lihat riwayat reimbursement dan pantau status pengajuan saat ini (Pending, Disetujui, Dibayar).
- **Autentikasi Aman**: Sistem login yang aman terintegrasi dengan API backend.

### 🛠 Teknologi yang Digunakan

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Desain**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS untuk React Native)
- **Manajemen State**: [Zustand](https://github.com/pmndrs/zustand)
- **Navigasi**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Jaringan**: Axios

### 🚀 Panduan Instalasi

#### Prasyarat

- [Node.js](https://nodejs.org/) (Versi LTS direkomendasikan)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)
- Aplikasi [Expo Go](https://expo.dev/client) di perangkat Android/iOS Anda (untuk pengujian)

#### Langkah Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/username-anda/recashly-mobile.git
   cd recashly-mobile
   ```

2. Install dependensi:
   ```bash
   npm install
   ```

3. Konfigurasi Variabel Lingkungan:
   Buat file `.env` di direktori root (jika diperlukan) dan sesuaikan URL API backend Anda.
   ```env
   EXPO_PUBLIC_API_URL=http://url-backend-anda/api
   ```

#### Menjalankan Aplikasi

Jalankan server pengembangan:

```bash
npx expo start
```

- **Scan kode QR** menggunakan aplikasi **Expo Go** (Android) atau aplikasi **Kamera** (iOS).
- Tekan `a` untuk membuka di Emulator Android.
- Tekan `i` untuk membuka di Simulator iOS.
- Tekan `w` untuk membuka di Browser Web.

### 📱 Build untuk Produksi

Untuk membuat file aplikasi siap install (APK/IPA):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login ke Expo
eas login

# Konfigurasi proyek
eas build:configure

# Build untuk Android
eas build -p android --profile preview

# Build untuk iOS
eas build -p ios --profile preview
```

### 🤝 Kontribusi

Kontribusi sangat diterima! Silakan kirimkan Pull Request untuk perbaikan atau fitur baru.

### 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.
