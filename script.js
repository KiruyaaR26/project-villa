// Ganti URL_API_KAMU dengan URL yang disalin dari langkah 4
const scriptURL = 'https://script.google.com/macros/s/AKfycbyLk9fBsvoLbS796vOq7E85bgCYeZC5ic7xeKR-54UPegyQ538HNdnAIP7G8oMhUtHPtg/exec';
// Menangkap elemen-elemen dari HTML
const form = document.forms['submit-to-google-sheet'];
const tabelBody = document.getElementById('tabel-body');
const elemenTotalUang = document.getElementById('total-uang');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Target biaya liburan villa
const targetBiaya = 5000000; 

// =========================================================================
// 1. FUNGSI UNTUK MENGAMBIL DAN MENAMPILKAN DATA (GET)
// =========================================================================
function loadData() {
  // Tampilkan animasi spinner sebelum mulai fetch data
  tabelBody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center;">
        <div class="spinner"></div>
        <p style="margin-top: 5px;">Mengambil data dari Google Sheets...</p>
      </td>
    </tr>
  `;
  
  // Reset tampilan total uang dan progress bar selama loading
  elemenTotalUang.innerText = 'Rp 0,00'; 
  progressBar.style.width = '0%';
  progressText.innerText = '0';

  fetch(scriptURL)
    .then(response => response.json())
    .then(data => {
      tabelBody.innerHTML = ''; // Hapus spinner setelah data masuk
      
      let totalKeseluruhan = 0; 

      // Jika data kosong
      if (data.length === 0) {
        tabelBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada data tabungan.</td></tr>';
        return;
      }

      // Looping setiap baris data dari Google Sheets
      // Looping setiap baris data dari Google Sheets
data.forEach((baris, index) => {
        let tr = document.createElement('tr');
        
        let nominalUang = parseFloat(baris.terkumpul) || 0;
        let statusSetoran = baris.status.toLowerCase();

        // 1. Siapkan variabel kosong untuk menampung warna
        let warnaLatar = '';

        // 2. Cek status dan tentukan warna serta perhitungan totalnya
        if (statusSetoran.includes('lunas') || statusSetoran.includes('valid')) {
          totalKeseluruhan += nominalUang; // Masuk hitungan
          warnaLatar = '#ecfdf5'; // Warna hijau pudar (hijau sukses)
        } else if (statusSetoran.includes('menunggu')) {
          warnaLatar = '#fffbeb'; // Warna kuning pudar (kuning peringatan)
        } else {
          warnaLatar = 'transparent'; // Biarkan default jika statusnya lain
        }

        // 3. Terapkan warna tersebut ke baris tabel (tr)
        tr.style.backgroundColor = warnaLatar;

        // Format nominal ke Rupiah
        let uangRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nominalUang);

        // Buat struktur baris tabel HTML
        // ... (kode warna sebelumnya) ...

        // Buat struktur baris tabel HTML
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${baris.nama}</td>
          <td>${uangRupiah}</td>
          <td>
            <strong>${baris.status}</strong><br>
            <!-- Tombol Hapus dengan memanggil fungsi hapusData() dan mengirim parameter nomor baris -->
            <button onclick="hapusData(${baris.baris})" style="background-color: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-top: 5px;">Hapus</button>
          </td>
        `;
        tabelBody.appendChild(tr);
      });

      // Update teks Total Terkumpul ke layar
      elemenTotalUang.innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalKeseluruhan);

      // Hitung dan update Progress Bar
      let persentase = (totalKeseluruhan / targetBiaya) * 100;
      if (persentase > 100) persentase = 100; // Maksimal 100%
      
      progressBar.style.width = persentase + '%';
      progressText.innerText = persentase.toFixed(1);
    })
    .catch(error => {
      console.error('Error!', error.message);
      tabelBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Gagal memuat data. Periksa koneksi atau URL API.</td></tr>';
    });
}


// =========================================================================
// 2. FUNGSI UNTUK MENGIRIM DATA BARU DARI FORM (POST)
// =========================================================================
form.addEventListener('submit', e => {
  e.preventDefault(); // Mencegah halaman me-reload

  // Ambil semua data inputan dari form
  let requestBody = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');

  // Ubah status tombol menjadi loading
  submitButton.innerText = "Mengirim...";
  submitButton.disabled = true;

  // Kirim data ke Google Sheets
  fetch(scriptURL, { method: 'POST', body: requestBody })
    .then(response => {
      alert('Berhasil! Data tabungan sudah masuk.');
      form.reset(); // Kosongkan input form
      
      // Kembalikan tombol seperti semula
      submitButton.innerText = "Tambah Data";
      submitButton.disabled = false;
      
      // Refresh tabel untuk menampilkan data terbaru
      loadData(); 
    })
    .catch(error => {
      console.error('Error!', error.message);
      alert('Gagal mengirim data.');
      
      // Kembalikan tombol jika gagal
      submitButton.innerText = "Tambah Data";
      submitButton.disabled = false;
    });
});


// =========================================================================
// 3. JALANKAN FUNGSI GET SAAT WEBSITE PERTAMA KALI DIBUKA
// =========================================================================
document.addEventListener("DOMContentLoaded", loadData);

// =========================================================================
// 4. FUNGSI UNTUK MENGHAPUS DATA
// =========================================================================
function hapusData(nomorBaris) {
  // Munculkan konfirmasi agar tidak kepencet tidak sengaja
  let konfirmasi = confirm("Apakah kamu yakin ingin menghapus data ini?");
  
  if (konfirmasi) {
    // Siapkan data yang mau dikirim (action = delete, dan nomor barisnya)
    let formData = new FormData();
    formData.append('action', 'delete');
    formData.append('baris', nomorBaris);

    // Tampilkan loading di tabel agar user tahu sedang diproses
    tabelBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Menghapus data...</td></tr>';

    fetch(scriptURL, { method: 'POST', body: formData })
      .then(response => {
        alert('Data berhasil dihapus!');
        loadData(); // Muat ulang tabel setelah berhasil dihapus
      })
      .catch(error => {
        console.error('Error!', error.message);
        alert('Gagal menghapus data.');
        loadData(); // Kembalikan tabel jika gagal
      });
  }
}