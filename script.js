// Ganti URL_API_KAMU dengan URL yang disalin dari langkah 4
const scriptURL = 'https://script.google.com/macros/s/AKfycbyLk9fBsvoLbS796vOq7E85bgCYeZC5ic7xeKR-54UPegyQ538HNdnAIP7G8oMhUtHPtg/exec';

// Menangkap elemen-elemen dari HTML
const form = document.forms['submit-to-google-sheet'];
const tabelBody = document.getElementById('tabel-body');
const elemenTotalUang = document.getElementById('total-uang');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Target biaya liburan villa keseluruhan & target per anak
const targetBiaya = 5000000; 
const TARGET_PER_ANAK = 300000;

// Daftar lengkap seluruh nama siswa sesuai absen kelas
const daftarAbsenKelas = [
  "Dechri Vanesa Mecca", "Muhammad Apdal", "Khalifia Inayah", "Nazwa Prina Al Atsilah", 
  "Shevaya Rubyfirlie", "Adinda Khodijah", "Siti Nasuhah", "Fathi Rakha Herlambang", 
  "Silvi Nur Aini", "Sayyida Nafisa Aulia", "Tiara Fadilatun Nisa", "Cikal Putri Awalia", 
  "Nabila Nazwa", "Ira Khairina", "Nuha Ramadhani", "Marsha Dwi Della", "Zihan Nuraeni", 
  "Nicky Puji Rahayu", "Rizki Fazil (boss)", "Muhammad Ridho Nur Islam", "Ahmad Faaza Fauzan Adzima", 
  "Nur Ahdiayani", "Ananda Dwi Aryani", "Mutia Zakiyyah", "Naila Nur Luna", 
  "Rihadatul Aisy Avicena Anwar", "Fathi Muhammad Rafi", "Munazi Julita Pratiwi", 
  "Regard Muhammad Rabbrindran", "Muhammad Fauzan Azhiimi", "Hanan Shofiy Rangkuti", 
  "Najwa Azzahra", "Shofi Nurjanah", "Kayla Shita Sabila", "Artika", 
  "Fauziyyah Nurzahra", "Hana Zada Videla", "Kaafi Alfath Syahri", "Echa Junika Alawiyah"
];

// =========================================================================
// 1. FUNGSI UNTUK MENGAMBIL DAN MENAMPILKAN DATA (GET)
// =========================================================================
function loadData() {
  tabelBody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center;">
        <div class="spinner"></div>
        <p style="margin-top: 5px;">Mengambil data dari Google Sheets...</p>
      </td>
    </tr>
  `;
  
  elemenTotalUang.innerText = 'Rp 0,00'; 
  progressBar.style.width = '0%';
  progressText.innerText = '0';

  fetch(scriptURL)
    .then(response => response.json())
    .then(data => {
      tabelBody.innerHTML = ''; 
      
      let totalKeseluruhan = 0; 

      if (data.length === 0) {
        tabelBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada data tabungan.</td></tr>';
      }

      // Looping riwayat setoran
      data.forEach((baris, index) => {
        let tr = document.createElement('tr');
        let nominalUang = parseFloat(baris.terkumpul) || 0;
        let statusSetoran = baris.status.toLowerCase();

        let warnaLatar = '';
        let statusKeren = ''; 

        if (statusSetoran.includes('lunas') || statusSetoran.includes('valid')) {
          totalKeseluruhan += nominalUang; 
          warnaLatar = '#ecfdf5'; 
          statusKeren = `<span style="color: #10b981; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                           <span class="iconify" data-icon="mdi:check-decagram" style="font-size: 1.2rem;"></span> Masuk
                         </span>`;
        } else if (statusSetoran.includes('menunggu')) {
          warnaLatar = '#fffbeb'; 
          statusKeren = `<span style="color: #f59e0b; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                           <span class="iconify" data-icon="mdi:clock-time-four-outline" style="font-size: 1.2rem;"></span> Menunggu
                         </span>`;
        } else {
          warnaLatar = 'transparent'; 
          statusKeren = `<strong>${baris.status}</strong>`;
        }

        tr.style.backgroundColor = warnaLatar;
        let uangRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nominalUang);

        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${baris.nama}</td>
          <td>${uangRupiah}</td>
          <td>${statusKeren}</td>
        `;
        tabelBody.appendChild(tr);
      });

      // Update Total & Progress Bar Utama
      elemenTotalUang.innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalKeseluruhan);

      let persentase = (totalKeseluruhan / targetBiaya) * 100;
      if (persentase > 100) persentase = 100; 
      progressBar.style.width = persentase + '%';
      progressText.innerText = persentase.toFixed(1);

      // Render kartu progres individu mahasiswa
      renderProgresIndividu(data);
    })
    .catch(error => {
      console.error('Error!', error.message);
      tabelBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Gagal memuat data. Periksa koneksi atau URL API.</td></tr>';
    });
}

// =========================================================================
// 1.5 FUNGSI RENDER PROGRES INDIVIDU (KARTU SISWA)
// =========================================================================
function renderProgresIndividu(dataSheets) {
  const container = document.getElementById('container-progres-siswa');
  if (!container) return;
  
  container.innerHTML = '';

  let petaSetoran = {};
  dataSheets.forEach(row => {
    let status = row.status ? row.status.toLowerCase() : '';
    if (status.includes('lunas') || status.includes('valid')) {
      let nama = row.nama.trim();
      let jumlah = parseFloat(row.terkumpul) || 0;
      petaSetoran[nama] = (petaSetoran[nama] || 0) + jumlah;
    }
  });

  daftarAbsenKelas.forEach(namaSiswa => {
    let terkumpulSiswa = petaSetoran[namaSiswa] || 0;
    let persentase = (terkumpulSiswa / TARGET_PER_ANAK) * 100;
    if (persentase > 100) persentase = 100;

    let formatTerkumpul = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(terkumpulSiswa);
    let badgeStatus = '';

    if (terkumpulSiswa >= TARGET_PER_ANAK) {
      badgeStatus = `<span style="color: #10b981; font-weight: bold; font-size: 0.8rem;">Lunas 🎉</span>`;
    } else {
      badgeStatus = `<span style="color: var(--text-muted); font-size: 0.8rem;">${persentase.toFixed(0)}%</span>`;
    }

    let kartu = document.createElement('div');
    kartu.className = 'kartu-progres-siswa';
    kartu.innerHTML = `
      <div class="kartu-header">
        <h4>${namaSiswa}</h4>
        ${badgeStatus}
      </div>
      <div class="mini-progress-container">
        <div class="mini-progress-bar" style="width: ${persentase}%;"></div>
      </div>
      <div class="kartu-footer">
        <span>${formatTerkumpul}</span>
        <span>Target: Rp 300k</span>
      </div>
    `;
    container.appendChild(kartu);
  });
}

// =========================================================================
// 2. FUNGSI UNTUK MENGIRIM DATA BARU DARI FORM (POST)
// =========================================================================
form.addEventListener('submit', e => {
  e.preventDefault(); 

  let requestBody = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');

  submitButton.innerText = "Mengirim...";
  submitButton.disabled = true;

  fetch(scriptURL, { method: 'POST', body: requestBody })
    .then(response => {
      showCustomAlert(
        "Hore, Setoran Berhasil! 🎉", 
        "Data tabungan kamu sudah meluncur ke server. Tinggal menunggu verifikasi dari bendahara kelas ya!"
      );
      showToast("Data berhasil dikirim!");
      
      form.reset(); 
      submitButton.innerText = "Tambah Data";
      submitButton.disabled = false;
      loadData(); 
    })
    .catch(error => {
      console.error('Error!', error.message);
      showCustomAlert("Waduh, Gagal Kirim! 😢", "Koneksi internetmu sepertinya lagi ngadat. Coba dicek lagi ya kawan.");
      submitButton.innerText = "Tambah Data";
      submitButton.disabled = false;
    });
});

// =========================================================================
// 3. JALANKAN FUNGSI GET SAAT WEBSITE PERTAMA KALI DIBUKA
// =========================================================================
document.addEventListener("DOMContentLoaded", loadData);

// =========================================================================
// FITUR SLIDESHOW FOTO VILLA
// =========================================================================
let slideIndex = 1;
showSlides(slideIndex); 

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("slide");
  let dots = document.getElementsByClassName("dot");
  
  if (n > slides.length) { slideIndex = 1 }
  if (n < 1) { slideIndex = slides.length }
  
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
}

// =========================================================================
// FITUR ANIMASI SAAT SCROLL (Intersection Observer)
// =========================================================================
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15 
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('tampil'); 
      observer.unobserve(entry.target);     
    }
  });
}, observerOptions);

document.querySelectorAll('.scroll-anim').forEach((el) => {
  observer.observe(el);
});

// =========================================================================
// SISTEM CUSTOM MODAL & TOAST ESTETIK
// =========================================================================
function showToast(pesan) {
  let existingToast = document.getElementById('custom-toast');
  if (existingToast) existingToast.remove();

  let toast = document.createElement('div');
  toast.id = 'custom-toast';
  toast.innerHTML = `<span class="iconify" data-icon="mdi:check-decagram" style="font-size: 1.3rem;"></span> ${pesan}`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function showCustomAlert(judul, pesan, callback) {
  let overlay = document.createElement('div');
  overlay.className = 'custom-modal-overlay';
  overlay.innerHTML = `
    <div class="custom-modal-box">
      <h3>${judul}</h3>
      <p>${pesan}</p>
      <div class="custom-modal-actions">
        <button class="modal-btn modal-btn-primary" id="modal-ok-btn">Mantap, Paham!</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('modal-ok-btn').onclick = () => {
    overlay.remove();
    if (callback) callback();
  };
}