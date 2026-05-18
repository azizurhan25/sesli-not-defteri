// ==========================================
// SESLI NOT DEFTERİ - ANA JAVASCRIPT DOSYASI
// ==========================================

// Şablonlar
const templates = {
    genel: `📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}
⏰ Saat: ${new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}
📌 Konu: 

🗣️ Not:
`,
    toplanti: `📊 TOPLANTI NOTU
📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}
👥 Katılımcılar: 
🎯 Toplantı Konusu: 

📝 Görüşülenler:


✅ Kararlar:
-

📌 Aksiyonlar:
-

⏭️ Sonraki Adım: 
`,
    fikir: `💡 FİKİR
⚡ Başlık: 
📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}

🎨 Fikir:


🔍 Detaylar:
-

✨ Potansiyel:

👍 Artıları:
-

👎 Eksileri:
-
`,
    ders: `📚 DERS NOTU
📖 Konu: 
📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}
👨‍🏫 Kaynak: 

📝 Notlar:


⭐ Önemli Noktalar:
•

❓ Sorular:
-
`,
    gunluk: `📖 KİŞİSEL GÜNLÜK
📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}
🌅 Zaman: ${new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}

💭 Bugün:


😊 Ruh Hali: 

⚡ Enerji Seviyesi: 

✨ İyi Giden Şeyler:
-

💪 Geliştirilecekler:
-

🙏 Minnettarlık:
-
`
};

// DOM Elementleri
const voiceBtn = document.getElementById('voiceBtn');
const noteText = document.getElementById('noteText');
const noteTitle = document.getElementById('noteTitle');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const shareBtn = document.getElementById('shareBtn');
const templateSelect = document.getElementById('templateSelect');
const notesList = document.getElementById('notesList');
const searchInput = document.getElementById('searchInput');
const statusText = document.getElementById('statusText');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

// Modal elementleri
const noteModal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalText = document.getElementById('modalText');
const modalEdit = document.getElementById('modalEdit');
const modalDelete = document.getElementById('modalDelete');
const closeModal = document.querySelector('.close');

// Değişkenler
let isRecording = false;
let currentNoteId = null;
let recognition = null;

// ==========================================
// SES TANIMA AYARLARI
// ==========================================

// Tarayıcı desteği kontrolü
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.lang = 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    // Ses tanıma başarılı
    recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            // Metni işle ve ekle
            addTranscriptToNote(finalTranscript);
        }
    };
    
    // Ses tanıma hatası
    recognition.onerror = (event) => {
        console.error('Ses tanıma hatası:', event.error);
        
        let errorMessage = 'Bir hata oluştu';
        
        switch(event.error) {
            case 'no-speech':
                errorMessage = 'Ses algılanamadı';
                break;
            case 'audio-capture':
                errorMessage = 'Mikrofon bulunamadı';
                break;
            case 'not-allowed':
                errorMessage = 'Mikrofon izni reddedildi';
                break;
            case 'network':
                errorMessage = 'İnternet bağlantısı gerekli';
                break;
        }
        
        showStatus(errorMessage, 'error');
        stopRecording();
    };
    
    // Ses tanıma başladı
    recognition.onstart = () => {
        showStatus('🎤 Dinleniyor...', 'listening');
    };
    
    // Ses tanıma bitti
    recognition.onend = () => {
        if (isRecording) {
            // Sürekli dinlemeye devam et
            try {
                recognition.start();
            } catch (e) {
                stopRecording();
            }
        } else {
            showStatus('', '');
        }
    };
    
} else {
    // Ses tanıma desteklenmiyor
    voiceBtn.disabled = true;
    voiceBtn.innerHTML = '<span>❌ Tarayıcınız sesli tanımayı desteklemiyor</span>';
    alert('⚠️ Sesli tanıma özelliği bu tarayıcıda çalışmıyor.\n\nLütfen Google Chrome veya Microsoft Edge kullanın.');
}

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================

// Metni nota ekle
function addTranscriptToNote(text) {
    // Metni temizle ve düzenle
    text = text.trim();
    
    if (text.length === 0) return;
    
    // İlk harfi büyük yap
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Cümle sonu noktalama işareti ekle
    if (!/[.!?]$/.test(text)) {
        // Soru cümlesi mi kontrol et
        const questionWords = ['ne', 'nasıl', 'neden', 'niçin', 'kim', 'nerede', 'ne zaman', 'hangi', 'kaç'];
        const firstWord = text.toLowerCase().split(' ')[0];
        
        if (questionWords.includes(firstWord)) {
            text += '?';
        } else {
            text += '.';
        }
    }
    
    // Cursor pozisyonunu al
    const cursorPos = noteText.selectionStart;
    const textBefore = noteText.value.substring(0, cursorPos);
    const textAfter = noteText.value.substring(cursorPos);
    
    // Yeni metni ekle
    noteText.value = textBefore + text + ' ' + textAfter;
    
    // Cursor'u yeni pozisyona taşı
    const newPos = cursorPos + text.length + 1;
    noteText.setSelectionRange(newPos, newPos);
    noteText.focus();
    
    // Vibrasyon (destekleniyorsa)
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Durum mesajı göster
function showStatus(message, type) {
    statusText.textContent = message;
    statusText.className = 'status-text ' + type;
}

// Kayıt başlat
function startRecording() {
    if (!recognition) {
        alert('⚠️ Ses tanıma özelliği kullanılamıyor!');
        return;
    }
    
    try {
        recognition.start();
        isRecording = true;
        
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Kaydı Durdur</span>';
        
        // Vibrasyon
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
    } catch (e) {
        console.error('Kayıt başlatılamadı:', e);
        showStatus('Kayıt başlatılamadı', 'error');
    }
}

// Kayıt durdur
function stopRecording() {
    if (recognition) {
        recognition.stop();
    }
    
    isRecording = false;
    
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '<span class="btn-icon">🎤</span><span class="btn-text">Sesli Not Başlat</span>';
    
    showStatus('✅ Kayıt durduruldu', 'success');
    
    // Vibrasyon
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    // 2 saniye sonra mesajı temizle
    setTimeout(() => {
        showStatus('', '');
    }, 2000);
}

// ==========================================
// OLAY DİNLEYİCİLERİ
// ==========================================

// Şablon değiştirme
templateSelect.addEventListener('change', (e) => {
    const selectedTemplate = templates[e.target.value];
    
    if (noteText.value.trim() === '' || confirm('Mevcut not silinecek. Devam edilsin mi?')) {
        noteText.value = selectedTemplate;
    }
});

// İlk yüklemede genel şablonu göster
noteText.value = templates.genel;

// Sesli not butonu
voiceBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

// Kaydet butonu
saveBtn.addEventListener('click', () => {
    const title = noteTitle.value.trim() || 'Başlıksız Not';
    const content = noteText.value.trim();
    
    if (!content || content === templates[templateSelect.value]) {
        alert('⚠️ Lütfen not içeriği girin!');
        return;
    }
    
    const note = {
        id: Date.now(),
        title: title,
        content: content,
        date: new Date().toLocaleString('tr-TR'),
        template: templateSelect.value
    };
    
    // LocalStorage'a kaydet
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.unshift(note);
    localStorage.setItem('notes', JSON.stringify(notes));
    
    // Başarı mesajı
    showStatus('✅ Not kaydedildi!', 'success');
    
    // Vibrasyon
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
    }
    
    // Formu temizle
    noteTitle.value = '';
    noteText.value = templates[templateSelect.value];
    
    // Notları yeniden yükle
    loadNotes();
    
    // 2 saniye sonra mesajı temizle
    setTimeout(() => {
        showStatus('', '');
    }, 2000);
});

// Temizle butonu
clearBtn.addEventListener('click', () => {
    if (noteText.value.trim() === '' || confirm('🗑️ Notu silmek istediğinizden emin misiniz?')) {
        noteTitle.value = '';
        noteText.value = templates[templateSelect.value];
        showStatus('🗑️ Temizlendi', 'success');
        
        setTimeout(() => {
            showStatus('', '');
        }, 2000);
    }
});

// Paylaş butonu
shareBtn.addEventListener('click', async () => {
    const title = noteTitle.value.trim() || 'Notum';
    const content = noteText.value.trim();
    
    if (!content) {
        alert('⚠️ Paylaşılacak içerik yok!');
        return;
    }
    
    // Web Share API desteği kontrolü
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: content
            });
            showStatus('✅ Paylaşıldı', 'success');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.log('Paylaşım hatası:', err);
            }
        }
    } else {
        // Panoya kopyala
        try {
            await navigator.clipboard.writeText(content);
            showStatus('📋 Panoya kopyalandı!', 'success');
            
            setTimeout(() => {
                showStatus('', '');
            }, 2000);
        } catch (err) {
            alert('❌ Kopyalama başarısız!');
        }
    }
});

// ==========================================
// NOTLARI YÜKLEME VE GÖSTERME
// ==========================================

function loadNotes(searchTerm = '') {
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    // Arama filtresi
    if (searchTerm) {
        notes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>${searchTerm ? 'Arama sonucu bulunamadı.' : 'Henüz kaydedilmiş not yok.'}</p>
                <p style="font-size: 0.9em; margin-top: 10px;">Mikrofona basıp ilk notunuzu oluşturun!</p>
            </div>
        `;
        return;
    }
    
    notes.forEach(note => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';
        
        const preview = note.content.substring(0, 200);
        const templateEmoji = {
            genel: '📝',
            toplanti: '💼',
            fikir: '💡',
            ders: '📚',
            gunluk: '📖'
        };
        
        noteDiv.innerHTML = `
            <h3>${templateEmoji[note.template] || '📝'} ${note.title}</h3>
            <div class="note-date">📅 ${note.date}</div>
            <div class="note-preview">${preview}${note.content.length > 200 ? '...' : ''}</div>
            <div class="note-actions">
                <button class="btn btn-info btn-small view-btn" data-id="${note.id}">👁️ Görüntüle</button>
                <button class="btn btn-danger btn-small delete-btn" data-id="${note.id}">🗑️ Sil</button>
            </div>
        `;
        
        notesList.appendChild(noteDiv);
    });
    
    // Not kartlarına tıklama olayı
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewNote(parseInt(btn.dataset.id));
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(parseInt(btn.dataset.id));
        });
    });
    
    // Not kartına tıklayınca da göster
    document.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn')) {
                const viewBtn = item.querySelector('.view-btn');
                if (viewBtn) {
                    viewNote(parseInt(viewBtn.dataset.id));
                }
            }
        });
    });
}

// Arama
searchInput.addEventListener('input', (e) => {
    loadNotes(e.target.value);
});

// Not görüntüle
function viewNote(id) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const note = notes.find(n => n.id === id);
    
    if (note) {
        currentNoteId = id;
        modalTitle.textContent = note.title;
        modalDate.textContent = '📅 ' + note.date;
        modalText.textContent = note.content;
        noteModal.style.display = 'block';
    }
}

// Not sil
function deleteNote(id) {
    if (confirm('🗑️ Bu notu silmek istediğinizden emin misiniz?')) {
        let notes = JSON.parse(localStorage.getItem('notes') || '[]');
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        showStatus('✅ Not silindi', 'success');
        loadNotes();
        
        setTimeout(() => {
            showStatus('', '');
        }, 2000);
    }
}

// Modal işlemleri
closeModal.addEventListener('click', () => {
    noteModal.style.display = 'none';
    currentNoteId = null;
});

window.addEventListener('click', (e) => {
    if (e.target === noteModal) {
        noteModal.style.display = 'none';
        currentNoteId = null;
    }
});

modalEdit.addEventListener('click', () => {
    if (currentNoteId) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const note = notes.find(n => n.id === currentNoteId);
        
        if (note) {
            noteTitle.value = note.title;
            noteText.value = note.content;
            templateSelect.value = note.template;
            
            noteModal.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Mevcut notu sil (düzenleme için)
            deleteNote(currentNoteId);
        }
    }
});

modalDelete.addEventListener('click', () => {
    if (currentNoteId) {
        deleteNote(currentNoteId);
        noteModal.style.display = 'none';
    }
});

// ==========================================
// DIŞA/İÇE AKTARMA
// ==========================================

// Dışa aktar
exportBtn.addEventListener('click', () => {
    const notes = localStorage.getItem('notes') || '[]';
    const blob = new Blob([notes], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `sesli-notlarim-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('📥 Notlar dışa aktarıldı', 'success');
    setTimeout(() => showStatus('', ''), 2000);
});

// İçe aktar
importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
        try {
            const importedNotes = JSON.parse(event.target.result);
            
            if (!Array.isArray(importedNotes)) {
                throw new Error('Geçersiz dosya formatı');
            }
            
            const existingNotes = JSON.parse(localStorage.getItem('notes') || '[]');
            const mergedNotes = [...importedNotes, ...existingNotes];
            
            localStorage.setItem('notes', JSON.stringify(mergedNotes));
            loadNotes();
            
            showStatus(`✅ ${importedNotes.length} not içe aktarıldı`, 'success');
            setTimeout(() => showStatus('', ''), 3000);
            
        } catch (err) {
            alert('❌ Dosya okunamadı! Lütfen geçerli bir yedekleme dosyası seçin.');
        }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset input
});

// ==========================================
// SERVICE WORKER (Çevrimdışı Çalışma)
// ==========================================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('✅ Service Worker kayıtlı'))
        .catch(err => console.log('❌ Service Worker hatası:', err));
}

// ==========================================
// SAYFA YÜKLENDİĞİNDE
// ==========================================

// Notları yükle
loadNotes();

// Hoş geldin mesajı (ilk kullanımda)
if (!localStorage.getItem('notes')) {
    setTimeout(() => {
        showStatus('👋 Hoş geldiniz! Mikrofona basıp ilk notunuzu oluşturun.', 'info');
        setTimeout(() => showStatus('', ''), 5000);
    }, 1000);
}

console.log('🎤 Sesli Not Defteri hazır!');