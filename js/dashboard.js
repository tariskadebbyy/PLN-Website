// ===============================
// CEK STATUS LOGIN
// ===============================
if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index.html";
}

// ===============================
// FUNGSI LOGOUT
// ===============================
document.getElementById("logoutBtn").addEventListener("click", e => {
    e.preventDefault();
    if (confirm("Apakah Anda yakin ingin logout?")) {
        localStorage.removeItem("loggedIn");
        sessionStorage.clear();
        window.location.href = "index.html";
    }
});

// ===============================
// KONFIGURASI GOOGLE SHEETS
// ===============================
const ID_SHEET = '1oqilMchLR06dTTTLe_4hNySj4eKWxmHlqACob6aXm-g';
const NAMA_SHEET = 'DATA KP ALL JATIM';
const API_KEY = 'AIzaSyCCa1sJXIaf3J0PFEfWbdxxsBzq-j45jt4';
const ENDPOINT = `https://sheets.googleapis.com/v4/spreadsheets/${ID_SHEET}/values/${encodeURIComponent(NAMA_SHEET)}!A:Z?key=${API_KEY}`;

// ===============================
// INISIALISASI PETA LEAFLET
// ===============================
const peta = L.map("map", { minZoom: 7, maxBounds: [[-9.5, 110], [-6.5, 115]] }).setView([-7.5, 112], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(peta);

let daftarMarker = [];
let markerTerfilter = [];
let kontrolRute;
let dataSemua = [];

// ===============================
// AMBIL DATA DARI GOOGLE SHEET
// ===============================
fetch(ENDPOINT)
    .then(res => res.json())
    .then(data => {
        const baris = data.values;
        if (!baris || baris.length < 2) return;

        // ===============================
        // INDEKS KOLOM SESUAI STRUKTUR
        // ===============================
        const IDX_UP3 = 3,
              IDX_ULP = 4,
              IDX_GI = 5,
              IDX_PENYULANG = 6,
              IDX_NAMA_KP = 13,
              IDX_KET_KP = 20,
              IDX_MERK_RTU = 23,
              IDX_LAT = 24,
              IDX_LNG = 25,
              IDX_JENIS_MODEM = 28,
              IDX_JENIS_KARTU = 31,
              IDX_MERK_BATERAI = 32;

        // ===============================
        // SET & MAP UNTUK FILTER
        // ===============================
        const setGI = new Set();
        const setPenyulang = new Set();
        const setRTU = new Set();
        const setUP3 = new Set();
        const mapULP = new Map();
        const mapGI = new Map();

        // ===============================
        // LOOP DATA
        // ===============================
        baris.slice(1).forEach(b => {
            const up3 = b[IDX_UP3]?.trim() || '';
            const ulp = b[IDX_ULP]?.trim() || '';
            const gi = b[IDX_GI]?.trim() || '';
            const penyulang = b[IDX_PENYULANG]?.trim() || '';
            const nama = b[IDX_NAMA_KP]?.trim() || '';
            const keterangan = b[IDX_KET_KP]?.trim() || '';
            const merk = b[IDX_MERK_RTU]?.trim() || '';
            const modem = b[IDX_JENIS_MODEM]?.trim() || '';
            const kartu = b[IDX_JENIS_KARTU]?.trim() || '';
            const baterai = b[IDX_MERK_BATERAI]?.trim() || '';
            const lat = parseFloat(b[IDX_LAT]);
            const lng = parseFloat(b[IDX_LNG]);

            if (isNaN(lat) || isNaN(lng)) return;

            if (gi) setGI.add(gi);
            if (penyulang) setPenyulang.add(penyulang);
            if (nama) setRTU.add(nama);
            if (up3) setUP3.add(up3);

            if (up3 && ulp) {
                if (!mapULP.has(up3)) mapULP.set(up3, new Set());
                mapULP.get(up3).add(ulp);
            }

            if (ulp && gi) {
                if (!mapGI.has(ulp)) mapGI.set(ulp, new Set());
                mapGI.get(ulp).add(gi);
            }

            const item = { up3, ulp, gi, penyulang, nama, keterangan, merk, modem, kartu, baterai, lat, lng };
            dataSemua.push(item);

            const marker = L.marker([lat, lng]).bindPopup(`
                <b>${nama}</b><br>
                UP3: ${up3 || '-'}<br>
                ULP: ${ulp || '-'}<br>
                GI: ${gi || '-'}<br>
                PENYULANG: ${penyulang || '-'}<br>
                Keterangan: ${keterangan || '-'}<br>
                RTU: ${merk || '-'}<br>
                Modem: ${modem || '-'}<br>
                Kartu: ${kartu || '-'}<br>
                Baterai: ${baterai || '-'}<br>
                <b>Koordinat:</b> ${lat.toFixed(5)}, ${lng.toFixed(5)}
            `);
            marker._data = item;
            daftarMarker.push(marker);
        });

        // ===============================
        // TAMPILKAN JUMLAH
        // ===============================
        document.getElementById("gi-count").textContent = setGI.size;
        document.getElementById("penyulang-count").textContent = setPenyulang.size;
        document.getElementById("rtu-count").textContent = setRTU.size;

        // ===============================
        // FILTER DROPDOWN
        // ===============================
        const filterUP3 = document.getElementById("up3Filter");
        const filterULP = document.getElementById("ulpFilter");
        const filterGI = document.getElementById("giFilter");

        [...setUP3].sort().forEach(v => {
            if (!v) return;
            const o = document.createElement("option");
            o.value = v;
            o.textContent = v;
            filterUP3.appendChild(o);
        });

        filterUP3.addEventListener("change", () => {
            filterULP.innerHTML = '<option value="">Pilih ULP</option>';
            filterGI.innerHTML = '<option value="">Pilih GI</option>';
            filterGI.disabled = true;
            const up3 = filterUP3.value;
            filterULP.disabled = !up3;

            if (!up3) return;
            const ulps = mapULP.get(up3);
            if (ulps) {
                [...ulps].filter(v => v).sort().forEach(v => {
                    const o = document.createElement("option");
                    o.value = v;
                    o.textContent = v;
                    filterULP.appendChild(o);
                });
            }
            perbaruiTampilan();
        });

        filterULP.addEventListener("change", () => {
            filterGI.innerHTML = '<option value="">Pilih GI</option>';
            const ulp = filterULP.value;
            filterGI.disabled = !ulp;

            if (!ulp) return;
            const gis = mapGI.get(ulp);
            if (gis) {
                [...gis].filter(v => v).sort().forEach(v => {
                    const o = document.createElement("option");
                    o.value = v;
                    o.textContent = v;
                    filterGI.appendChild(o);
                });
            }
            perbaruiTampilan();
        });

        filterGI.addEventListener("change", perbaruiTampilan);

        // ===============================
        // FUNGSI UPDATE MAP DAN TABEL
        // ===============================
        function perbaruiTampilan() {
            const up3 = filterUP3.value,
                  ulp = filterULP.value,
                  gi = filterGI.value;

            markerTerfilter = daftarMarker.filter(m => {
                const d = m._data;
                return (!up3 || d.up3 === up3) &&
                       (!ulp || d.ulp === ulp) &&
                       (!gi || d.gi === gi);
            });

            perbaruiTabel(dataSemua.filter(d =>
                (!up3 || d.up3 === up3) &&
                (!ulp || d.ulp === ulp) &&
                (!gi || d.gi === gi)
            ));

            peta.eachLayer(l => { if (l instanceof L.Marker) peta.removeLayer(l); });
            markerTerfilter.forEach(m => m.addTo(peta));

            if (markerTerfilter.length === 1) {
                peta.flyTo(markerTerfilter[0].getLatLng(), 14, { duration: 1.0 });
            } else if (markerTerfilter.length > 1) {
                peta.fitBounds(L.featureGroup(markerTerfilter).getBounds());
            }
        }

        perbaruiTabel(dataSemua);
    });

// ===============================
// TABEL DATA
// ===============================
function perbaruiTabel(daftarData) {
    const tbody = document.getElementById("rtuTableBody");
    tbody.innerHTML = "";

    if (!daftarData.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data ditemukan</td></tr>';
        return;
    }

    daftarData.forEach(d => {
        const tr = document.createElement("tr");
        tr.className = "rtu-row";
        tr.innerHTML = `
            <td>${d.nama || '-'}</td>
            <td>${d.keterangan || '-'}</td>
            <td>${d.merk || '-'}</td>
            <td>${d.modem || '-'}</td>
            <td>${d.kartu || '-'}</td>
            <td>${d.baterai || '-'}</td>
            <td>${d.penyulang || '-'}</td>
            <td>${d.up3 || '-'}</td>
        `;

        // Klik baris tabel → fokus peta + rute otomatis
        tr.addEventListener("click", () => {
            document.querySelectorAll(".rtu-row.active").forEach(r => r.classList.remove("active"));
            tr.classList.add("active");
            const mk = daftarMarker.find(m => m._data.nama === d.nama);
            if (mk) {
                peta.flyTo(mk.getLatLng(), 14, { duration: 1.0 });
                mk.openPopup();

                // Panggil rute otomatis saat memilih RTU
                tampilkanRuteOtomatis(mk);
            }
        });
        tbody.appendChild(tr);
    });
}

// ===============================
// FUNGSI RUTE OTOMATIS
// ===============================
function tampilkanRuteOtomatis(markerTujuan) {
    if (!markerTujuan) return;

    if (kontrolRute) peta.removeControl(kontrolRute);

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(pos => {
            const posisiAwal = L.latLng(pos.coords.latitude, pos.coords.longitude);
            const posisiTujuan = markerTujuan.getLatLng();

            if (kontrolRute) peta.removeControl(kontrolRute);

            kontrolRute = L.Routing.control({
                waypoints: [posisiAwal, posisiTujuan],
                routeWhileDragging: true,
                showAlternatives: false,
                createMarker: () => null
            }).addTo(peta);

        }, err => {
            alert("Gagal mendapatkan lokasi Anda: " + err.message);
        }, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 5000
        });
    } else {
        alert("Browser Anda tidak mendukung geolokasi.");
    }
}
